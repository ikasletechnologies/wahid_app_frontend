import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing, Image, TouchableOpacity, StatusBar, PanResponder, ScrollView, TouchableWithoutFeedback, LayoutAnimation, ImageBackground, KeyboardAvoidingView, Platform, Keyboard, Share, Alert } from 'react-native';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle as SvgCircle, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNames } from '../context/NamesContext';
import { usePlaylist } from '../context/PlaylistContext';
import { useAppTheme } from '../context/ThemeContext';
import { useIsFocused } from '@react-navigation/native';
import NameDetailHeader from '../components/NameDetailHeader';
import TimeBasedBackground from '../components/TimeBasedBackground';
import ReadingSettingsModal from '../components/ReadingSettingsModal';
import http from '../config/http';
import { FONTS } from '../theme';

const { width: SW, height: SH } = Dimensions.get('window');
const BASE_W = 393;
const BASE_H = 900;
const wScale = SW / BASE_W;
const hScale = SH / BASE_H;
const rs = (n) => Math.round(n * wScale);
const hs = (n) => Math.round(n * hScale);

const countWords = (content) => {
  if (!content) return 0;
  if (Array.isArray(content)) {
    return content.reduce((sum, item) => {
      if (typeof item === 'string') {
        return sum + countWords(item);
      }
      if (item && typeof item === 'object') {
        return sum + countWords(item.view || item.simpleMeaning || item.tr || item.arabic || '');
      }
      return sum;
    }, 0);
  }
  return content.trim().split(/\s+/).filter(w => w.length > 0).length;
};

const getMeaningSentences = (nameObj) => {
  let displayMeaning = nameObj.description || nameObj.meaning || '';
  if (typeof displayMeaning === 'string' && displayMeaning.includes('—')) {
    displayMeaning = displayMeaning.split('—')[1].trim();
  }
  let parts = displayMeaning.split(/([.?!])(?:[\s]+|$)/);
  let sentences = [];
  for (let i = 0; i < parts.length; i += 2) {
    let text = parts[i];
    let punct = parts[i + 1] || '';
    let combined = (text + punct).trim();
    if (combined && combined.replace(/[.?!\s]/g, '').length > 0) sentences.push(combined);
  }
  return sentences.length > 0 ? sentences : [displayMeaning.trim()];
};

const getReferenceSentences = (refDataArray) => {
  const array = Array.isArray(refDataArray) ? refDataArray : [refDataArray];
  let sentences = [];
  array.forEach((ref) => {
    if (typeof ref === 'string') {
      let parts = ref.split(/([.?!])(?:[\s]+|$)/);
      for (let i = 0; i < parts.length; i += 2) {
        let text = parts[i];
        let punct = parts[i + 1] || '';
        let combined = (text + punct).trim();
        if (combined && combined.replace(/[.?!\s]/g, '').length > 0) {
          sentences.push({ type: 'string', text: combined, refData: ref });
        }
      }
    } else {
      const processText = (text, fieldType) => {
        if (!text) return;
        let parts = text.split(/([.?!])(?:[\s]+|$)/);
        for (let i = 0; i < parts.length; i += 2) {
          let textPart = parts[i];
          let punct = parts[i + 1] || '';
          let combined = (textPart + punct).trim();
          if (combined && combined.replace(/[.?!\s]/g, '').length > 0) {
            sentences.push({ type: fieldType, text: combined, refData: ref });
          }
        }
      };
      processText(ref.simpleMeaning, 'simpleMeaning');
      processText(ref.whyThisVerse || ref.significance, 'significance');
    }
  });
  return sentences;
};

const flattenToSentences = (arrayOrString) => {
  if (!arrayOrString) return [];
  const array = Array.isArray(arrayOrString) ? arrayOrString : [arrayOrString];
  let sentences = [];
  array.forEach(item => {
    if (!item) return;
    const itemStr = typeof item === 'object' ? (item.view || '') : String(item);
    let parts = itemStr.split(/([.?!])(?:[\s]+|$)/);
    for (let i = 0; i < parts.length; i += 2) {
      let text = parts[i];
      let punct = parts[i + 1] || '';
      let combined = (text + punct).trim();
      if (combined && combined.replace(/[.?!\s]/g, '').length > 0) {
        sentences.push(combined);
      }
    }
  });
  return sentences;
};

const FadeContent = ({ contentKey, children }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [displayChildren, setDisplayChildren] = useState(children);
  const prevKey = useRef(contentKey);

  useEffect(() => {
    if (contentKey !== prevKey.current) {
      prevKey.current = contentKey;
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setDisplayChildren(children);
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      });
    } else {
      setDisplayChildren(children);
    }
  }, [contentKey, children]);

  return <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>{displayChildren}</Animated.View>;
};

const REFLECTION_ANSWERS_MAP = {
  1: [
    `Begin and end tasks consciously with "Bismillah" and "Alhamdulillah," letting your heart remember that every moment is under the gaze of Allah.`,
    `Say Aʿūdhu billāhi mina sh-shayṭāni r-rajīm (I seek refuge in Allah from Shayṭān, the accursed) when there is waswasa (Shayṭān's whispers), trusting that Allah protects your heart from those whispers`
  ],
  2: [
    `Read Surat al-Ikhlas in the morning and evening.`,
    `When your heart feels pulled toward many things for comfort or safety, come back to Al-Ahad. Bring your hope back to the One.`
  ],
  3: [
    `Recite Sūrat al-Aʿlā in your witr prayer as the Prophet did consistently.`,
    `If you find the Qur'an difficult to memorise, make the dhikr the Prophet taught: SubḥānAllāh, wal-ḥamdulillāh, wa lā ilāha illallāh, wa Allāhu Akbar, wa lā ḥawla wa lā quwwata illā billāhil-ʿAliyyil-ʿAẓīm.`
  ],
  4: [
    `Raise your hands in duʿāʾ often and with certainty. You are asking Al-Akram, the One who is ashamed to send you away empty-handed.`,
    `When you intend a good deed, know that the intention alone is already recorded. Act on it and the reward multiplies beyond measure.`,
    `The first word revealed was Iqraʾ (Read). Seeking knowledge is an act of recognising Al-Akram, who taught humanity by the pen what it did not know.`
  ],
  5: [
    `Say Lā ilāha illallāh 100 times each morning. The Prophet said it is the best of what he and the Prophets before him said.`,
    `Before every act of worship, pause and remind yourself: this is for Al-Ilāh alone. That intention is what separates worship from habit.`,
    `When your heart feels pulled toward something in creation, return to Lā ilāha illallāh. It resets the heart to its correct direction.`
  ],
  7: [
    `If you lost someone, say Inna lillahi wa inna ilayhi rajiun and mean it. You are saying you came from Al-Akhir and you return to Him.`,
    `Recite the bedtime dua of the Prophet that names Him the First and the Last.`,
    `Before sleeping, You will ask yourself, if today were my last day, was I moving toward Al-Akhir or away from Him. Let that question shape tomorrow.`
  ],
  8: [
    `Make a habit of noticing the signs of Allah around you daily - in nature, in your body, in your circumstances. Each one is Adh-Dhāhir making Himself known.`,
    `Avoid open sin with the awareness that Adh-Dhāhir sees everything that is manifest. What is done openly before people is seen first by Him.`,
    `Recite the bedtime dua of the Prophet that names Him the Manifest above whom there is nothing.`
  ],
  9: [
    `Guard your inner state as carefully as your outer one. Al-Batin sees the heart more clearly than the face.`,
    `Give charity in secret often. The Prophet said secret charity cools the anger of the Lord, and Al-Batin sees every hidden good.`,
    `Recite the bedtime dua of the Prophet that names Him the Hidden, and ask Him to settle your debts and free you from need.`
  ],
  10: [
    `When you look in the mirror, remember you are looking at the work of Al-Bāriʾ. He originated your form with deliberate precision. Treat your body accordingly, with care, not contempt.`,
    `Qur'an 59:24 mentions Al-Khāliq, Al-Bāriʾ, and Al-Muṣawwir together. Reflect on this āyah after Fajr, the One who planned, originated, and fashioned all of creation is the One you just prayed to.`,
    `When you notice beauty or precision in creation, a leaf, a human eye, a perfectly formed child; say SubḥānAllāh. You are witnessing Al-Bāriʾ's work.`
  ],
  11: [
    `Make duʿāʾ to Al-Barr regularly, especially in difficulty. The people of Jannah say they called upon Him before. make that your habit now, in this life.`,
    `Spread kindness in your home first. The Prophet said Allah loves kindness and confers upon it what He does not confer upon harshness. Begin with the people closest to you.`,
    `Count three specific blessings from Al-Barr each morning. Gratitude for His goodness is itself an act of worship that draws you closer to Him.`
  ],
  12: [
    `Bring the concept of iḥsān into every prayer. Before you begin, remind yourself: Al-Baṣīr sees me right now. Let that awareness shape how you stand, how you bow, how you focus.`,
    `When you feel unseen or unrecognised for your good deeds, remember that Al-Baṣīr has seen every single one. Seek His recognition, not theirs.`
  ],
  13: [
    `Make istighfār a daily practice. The Prophet said he sought forgiveness from Allah more than seventy times a day. Ṣaḥīḥ al-Bukhārī 6307 (Grade: Sahih) At-Tawwāb accepts it every time.`,
    `Never delay tawbah. The door is open now. Read Qur'an 39:53, when guilt feels crushing.`,
    `After committing a sin, perform wuḍūʾ and pray two rakʿahs. The Prophet said: "There is no person who commits a sin, then performs wuḍūʾ well, then prays two rakʿahs, then seeks forgiveness from Allah, except that Allah will forgive him."`
  ],
  14: [
    `Open your night prayer (tahajjud) with the opening the Prophet used: Allāhu Akbaru dhāl-jabarūti wal-malakūti wal-kibriyāʾi wal-ʿaẓamah.`,
    `When something feels permanently broken, a relationship, a situation, your own state, turn to Al-Jabbar. He is the Restorer, and mending the broken is part of what this name means.`,
    `When you feel overpowered by a difficulty, remember: Al-Jabbār is never overpowered. The One you are calling upon has never lost to anything.`
  ],
  15: [
    `When you send a loved one off, a child to school, a traveller on a journey, say hasbunallāh wa niʿmal wakīl and entrust them to Al-Ḥāfiẓ as Yaʿqūb did. He is a better guardian than you could ever be.`,
    `Begin memorising the Qur'an, even one āyah at a time. Every āyah you preserve in your heart is your share in the guarantee of Qur'an 15:9.`
  ],
  16: [
    `Hold yourself to account before Al-Hasib does. Umar said, hold yourselves accountable before you are held accountable. Review your day each evening.`,
    `Say Hasbunallahu wa nimal-Wakil when facing fear or difficulty. It is a statement of complete reliance on the One who is enough.`,
    `Return every greeting with a better one. Qur'an 4:86 places Al-Hasib right after this, every greeting is being counted.`
  ],
  17: [
    `Be mindful of your words. Qur'an 50:18 tells us every word is recorded by Al-Ḥafīẓ. The scholars said: speak good or remain silent.`,
    `Recite Āyat al-Kursī after every obligatory prayer and before sleeping. The Prophet taught that reciting it before sleep brings the protection of Al-Ḥafīẓ throughout the night.`
  ],
  18: [
    `Call upon Allah with the certainty that He receives you as Al-Ḥafiyy with full benevolence and care. The Prophet said "He is too generous to let His servant raise his hands to Him and return them empty".`,
    `Learn from Ibrāhīm, he called Allah Al-Ḥafiyy in a moment of pain, asking forgiveness for a father who rejected him. Turn to Al-Ḥafiyy in your hardest moments, not only in your easiest.`,
    `Never see your sins as a barrier to duʿāʾ. Al-Ḥafiyy is kind to the returning servant regardless of what came before.`
  ],
  19: [
    `When doubt enters your heart about any of Allah's promises, Jannah, the Day of Judgement, resurrection, return to this Name. Al-Ḥaqq does not make promises that fail.`,
    `Keep your own speech true. The Prophet said truthfulness leads to righteousness, and righteousness leads to Paradise.`
  ],
  20: [
    `Read the Qur'an with the intention of seeking clarity from Al-Mubīn. It was sent as a clear Book to make things clear and plain.`,
    `In matters of doubt between ḥalāl and ḥarām, return to what is clear. The Prophet said the clear has been made clear by Al-Mubīn now stick to it and leave what is doubtful.`,
    `When people ask about Islam, speak with clarity and confidence. Al-Mubīn sent a clear message, represent it clearly.`
  ],
  21: [
    `When something difficult or unwanted happens, say Allāhu Akbar and follow it with Qur'an 2:216. Train yourself to remember: Al-Ḥakīm knows what you do not know.`,
    `Do not pick and choose from the commands of Allah. His wisdom in every ruling is complete even when the reason is not apparent to you. Yūsuf did not understand his story until its end - but he trusted Al-Ḥakīm throughout.`,
    `When something small annoys you: illness, a delay, a loss, recall the hadith about fever erasing sins. Al-Ḥakīm wastes nothing in your life, not even your smallest discomfort.`
  ],
  22: [
    `In moments of distress, recite the duʿāʾ the Prophet used: Lā ilāha illallāhu al-ʿAẓīmu al-Ḥalīm... It is a proven Prophetic practice for times of difficulty.`,
    `Never mistake Al-Ḥalīm's patience for permission. When you are not punished for a sin, that is His forbearance opening a door for your repentance.`,
    `Embody ḥailm in your dealings. Ibrāhīm is described in the Qur'an as ḥalīm, for his gentleness even with those who wronged him. Al-Ḥalīm loves this quality in His servants.`
  ],
  23: [
    `Say alḥamdulillāh with awareness as an acknowledgment that every good in your life came from Al-Ḥamīd and every difficulty is an opportunity to praise Him still.`,
    `In Ṣalāh, recite the Durūd Ibrāhīm with presence on the words Ḥamīdun Majīd. You are addressing Al-Ḥamīd directly every time you pray.`,
    `When hardship comes, say alḥamdulillāh ʿalā kulli ḥāl praise to Allah in every circumstance. Umm Sulaym earned Bayt al-Ḥamd by praising Him in her hardest moment.`
  ],
  24: [
    `In every moment of distress, say Yā Ḥayyu yā Qayyūm, bi-raḥmatika astaghīth. This is the duʿāʾ the Prophet himself turned to when distressed.`,
    `Recite Āyat al-Kursī after every obligatory prayer, and before sleeping. You begin with Al-Ḥayy Al-Qayyūm, the One who never sleeps, watching over you through the night.`,
    `Put your tawakkul in Al-Ḥayy alone. Qur'an 25:58 commands it directly: put your trust in the Ever-Living who does not die. Every other source of reliance will eventually leave you.`
  ],
  25: [
    `Say Yā Ḥayyu yā Qayyūm, bi-raḥmatika astaghīth in every moment of distress. This is the Prophetic response to hardship by turning to Al-Qayyūm.`,
    `Remember in every moment of dependence on people, money, or circumstances, all of it is being sustained by Al-Qayyūm. Shift your reliance to the source.`,
    `Recite Āyat al-Kursī before sleeping. You are placing yourself under the care of Al-Ḥayy Al-Qayyūm, the One who never sleeps and sustains all things through the night.`
  ],
  26: [
    `Before every act of worship, check your intention. Al-Khabīr is fully aware of why you are doing it. The Prophet said every deed is by its intention and Al-Khabīr knows yours completely.`,
    `Take stock of your deeds regularly. Qur'an 59:18 commands every soul to look at what it has sent ahead. Al-Khabīr already knows, you are the one who needs to examine yourself.`,
    `When you feel misunderstood by people or your sincerity goes unrecognised, remember Al-Khabīr knows the truth of every situation. His awareness is enough.`
  ],
  27: [
    `When you look at your own body - the complexity of your eyes, your hands, your beating heart - say SubḥānAllāh. You are looking at the direct work of Al-Khāliq.`,
    `Reflect on the stages of human creation in Qur'an 23:12-14 regularly. The scholars of tafsīr say this passage moved even the Companion ʿUmar ibn al-Khaṭṭāb to spontaneous praise when he first heard it.`,
    `Remember creation has purpose. Qur'an 23:115 - "Did you think We created you without purpose?" - is a question from Al-Khāliq. Let your life be a worthy answer to it.`
  ],
  28: [
    `When doubt about resurrection comes, return to Qur'an 36:81. The One who made everything from nothing can remake you. Al-Khallaq is the answer to every doubt about the afterlife.`,
    `Reflect on how creation never stops. Every new moment is Al-Khallaq at work. Greet each new day with Alhamdulillah, He created this day for you.`,
    `Never think your sins have reduced what Allah can do for you. His creating and giving are endless, and the ocean of His mercy is not lessened by what He pours out.`
  ],
  29: [
    `When you receive a warning from the Qur'an, from a wise person, from a close call, recognise it as Ar-Raʾūf acting before harm reaches you. Thank Him and heed it.`,
    `When you go through difficulty, remember both hadiths above: Ar-Raʾūf is turning your pain into expiation. Nothing is wasted in His compassion.`,
    `Say Allāhumma innaka Ar-Raʾūf Ar-Raḥīm, farḥamnī (O Allah, You are the Most Compassionate and Merciful, so have mercy on me) especially in moments when you feel your sins have distanced you from Him.`
  ],
  30: [
    `Begin every significant action with Bismillāhi Ar-Raḥmāni Ar-Raḥīm. You are invoking the One whose mercy encompasses all things and asking it to cover what you are about to do.`,
    `Show mercy to people generously. The Prophet made it a condition: be merciful to those on earth, and Ar-Raḥmān will have mercy on you. Your mercy to others is a direct path to His mercy upon you.`,
    `When you feel distant from Allah, remember: His mercy encompasses all things. (Qur'an 7:156) You are included in "all things." Return to Him`
  ],
  31: [
    `Read Qur'an 39:53 whenever you feel crushed by your sins. This verse is a direct call from Ar-Raḥīm to you personally, "O My servants." It is one of the most hope-giving verses in the Qur'an.`,
    `Every time you intend a good deed, know that Ar-Raḥīm has already recorded it. Do the deed and watch the reward multiply. The system itself is a mercy.`,
    `Make Bismillāhi Ar-Raḥmāni Ar-Raḥīm meaningful every time you recite it. You are calling on the One whose mercy encompasses all things and whose mercy is perpetually active toward you.`
  ],
  32: [
    `After every obligatory prayer, affirm that only Ar-Razzaq gives and withholds, saying there is no one who can hold back what He gives, and no one who can give what He withholds.`,
    `When you feel anxious about money, remember your provision was written before your birth. Your job is to seek it in lawful ways, and Ar-Razzaq will deliver it.`,
    `Look at those who have less than you, as the Prophet advised. This is how the gifts of Ar-Razzaq become visible to you.`
  ],
  33: [
    `Before every action bring to your mind that Ar-Raqīb is watching. Not with fear, but with the consciousness of iḥsān. This single awareness transforms ordinary acts into acts of worship.`,
    `Ar-Raqīb watches over your family when you are not there, over your children at school, over your loved ones while you sleep. Entrust them to Him consciously and find peace in it.`,
    `Be watchful over yourself. Imam al-Ghazali taught that the servant who knows Ar-Raqīb is watching learns to watch over his own heart and his own actions. The one who guards himself has a guardian watching over him.`
  ],
  34: [
    `After every obligatory prayer, say: Allāhumma antas-Salāmu wa minkas-salāmu, tabārakta yā dhal-Jalāli wal-Ikrām. This is the Prophetic dhikr specifically using this Name.`,
    `Spread salām generously to those you know and those you do not. The Prophet said it is one of the conditions of entering Jannah and it fosters love. Each salām is returning a Name of Allah back to the people.`,
    `When your heart is anxious or restless, remember the heart only finds peace in As-Salām. Turn to Him in that moment and ask for His salām to descend upon you.`
  ],
  35: [
    `Make dua sure that As-Sami hears every word. You need not raise your voice or despair if the answer is delayed. Yaqub made dua for years, and As-Sami heard every one.`,
    `When rising from ruku, say Samiallahu liman hamidah with awareness. You are affirming that As-Sami hears your praise and responds.`,
    `Guard your words. As-Sami hears not only your dua but every word you speak, in anger, in gossip, in honesty, and in kindness. Speak as one who is always heard.`
  ],
  36: [
    `Increase your voluntary acts of worship, extra prayers, extra charity, extra dhikr. specifically connects Ash-Shākir to voluntary good. He sees what no one asked you to do.`,
    `Be genuinely grateful to people in your life. The Prophet connected this directly to gratitude to Allah. Ash-Shākir is pleased when thankfulness is a lived quality, not just words.`,
    `When you feel your deeds are small or insignificant, remember Ash-Shākir. Nothing sincere is small to Him.`
  ],
  37: [
    `Never underestimate any good deed. Removing a thorn earned forgiveness. Ash-Shakūr rewards what you consider small far beyond what you can imagine.`,
    `Be consistent with your dhikr especially SubḥānAllāh wa biḥamdih. The Prophet described its multiplication directly. Ash-Shakūr gives back in proportion to constancy.`,
    `When you give sadaqah, give it knowing Ash-Shakūr will return it multiplied. Qur'an 42:23 promises that every good deed earns more goodness. The deal with Ash-Shakūr is always in your favour.`
  ],
  38: [
    `Do good deeds even when no one is watching. Ash-Shahīd is the witness that matters. The deed unseen by people but witnessed by Him is often the purest.`,
    `Say the shahādah with awareness of its meaning. Ashhadu ( I bear witness) is your personal declaration mirroring the attribute of Ash-Shahīd. Let it be said with the weight it deserves.`,
    `When you feel your efforts go unrecognised, recall Qur'an 41:53: Is it not sufficient that your Lord witnesses all things? Ash-Shahīd's witness is the only one that will matter on the Day of Judgement.`
  ],
  39: [
    `Memorise and use the duʿāʾ of Al-Aḥad As-Samad. The Prophet identified it as containing the Greatest Name. Begin your most important supplications with it.`,
    `Ask Allah for everything, large and small. As-Samad is never diminished by the size of your request. Limiting your duʿāʾ is a failure to understand who As-Samad is.`,
    `When you feel the pull to lean heavily on a person, a job, or a source of worldly security - remember that all of these have hollow spaces, all are themselves in need. As-Samad alone has no hollow. Direct your deepest need and trust toward Him.`
  ],
  40: [
    `When you feel proud of what you know, remember the angels' words: "We have no knowledge except what You taught us." All knowledge, including your own, is borrowed from Al-ʿAlīm.`,
    `When you feel unseen or misunderstood by others, remember Al-ʿAlīm knows everything about your situation, including what no one else has taken the time to understand`
  ],
  41: [
    `Recite the duʿāʾ above when you fear being led astray or losing your way. It is the exact wording the Prophet used, calling specifically on Allah's ʿizzah for protection.`,
    `If you seek strength, honour, or success, ask Al-ʿAzīz directly for it rather than chasing it through means that compromise your dīn. True ʿizzah belongs to Allah, to His Messenger, and to the believers.`,
    `Remember that worldly power corrupts because it is paired with weakness and ignorance. Al-ʿAzīz alone holds power paired perfectly with wisdom and mercy. let that be the standard you measure all earthly power against.`
  ],
  42: [
    `Say Subḥāna Rabbiyal ʿAẓīm in rukūʿ with presence and reflection. You are glorifying the One whose greatness has no limit, multiple times in every prayer.`,
    `Make the dhikr SubḥānAllāhi wa biḥamdihi, SubḥānAllāhil ʿAẓīm part of your daily routine. The Prophet described it as light on the tongue but heavy on the scale.`,
    `When facing a problem that feels impossibly large, remember Al-ʿAẓīm's Throne extends over all the heavens and earth without tiring Him. Your difficulty, however large it feels, is small before Him.`
  ],
  43: [
    `Memorise ʿĀʾishah's duʿāʾ above and use it generously. It is among the simplest and most complete duʿāʾs in the entire Sunnah.`,
    `When someone wrongs you, consider responding with pardon rather than retaliation in equal measure. Qur'an 4:149 connects this directly to Al-ʿAfuww , the trait He loves in His servants.`,
    `Increase your istighfār beyond moments of sin. The Prophet is free of major sin, still asked for forgiveness more than seventy times a day. Make it a constant habit.`
  ],
  44: [
    `Guard your heart, not only your actions. He knows what is within the chest. (Qur'an 67:13)`,
    `Bring your worries to the One who already knows them. Use the dua of grief above.`,
    `Stay humble about what you know. Above every knowing person is One more knowing. (Qur'an 12:76)`
  ],
  45: [
    `Learn the duʿāʾ taught to the man who could not learn Qur'an. It contains Al-ʿAliyy and is short, complete, and accessible for anyone, especially those struggling with memorisation.`,
    `When you speak good words or do righteous deeds, remember they ascend to Al-ʿAliyy. Let that motivate the quality and sincerity of what you say and do, even when no one else notices.`,
    `In moments of fear, recall the words given to Mūsā: "Fear not, you are the higher one." The one connected to Al-ʿAliyy stands above the fear of any worldly power.`
  ],
  46: [
    `Never let the size of your sins stop you from seeking forgiveness. The hadith above is explicit: an earthload of sin is met with an earthload of forgiveness, as long as shirk is avoided.`,
    `Increase your istighfār specifically as a means of seeking provision and ease, following the example of Nūḥ. Directly links seeking forgiveness to increase in rain, wealth, and children.`,
    `Conceal the faults of others rather than exposing them. The Prophet promised that Al-Ghaffār conceals the faults of those who conceal the faults of others.`
  ],
  47: [
    `Do not let repetition of the same sin convince you that forgiveness has run out. The hadith above shows Al-Ghafūr forgiving the same person for the same sin, repeatedly, as long as they keep turning back.`,
    `Make istighfār a regular habit, The Prophet himself sought forgiveness more than seventy times daily despite being protected from sin.`,
    `Avoid exposing the faults of others. Concealing people's faults is directly tied in the hadith to having your own faults concealed by Al-Ghafūr.`
  ],
  48: [
    `Ask Al-Ghaniyy generously and without hesitation. The hadith above proves His giving has no limit that your asking could ever reach.`,
    `Use ʿAlī's duʿāʾ regularly, especially when facing debt, want, or temptation toward unlawful shortcuts. It asks for sufficiency through the lawful and independence from everyone but Allah.`,
    `Measure richness by contentment, not possession. Reflect on how the Prophet lived simply yet completely content, because his sufficiency was in Al-Ghaniyy alone.`
  ],
  49: [
    `Say the duʿāʾ above every time you enter and leave the masjid. It is the Prophetic sunnah and a direct, practical way to call upon Al-Fattāḥ in your daily routine.`,
    `When facing a difficult decision, pray ṣalāt al-istikhārah and ask Al-Fattāḥ to open your heart to what is best for you, in your dīn and your dunyā.`,
    `When something in your life feels permanently stuck or closed, remember: only Al-Fattāḥ truly opens or withholds. People and circumstances are means, not the source.`
  ],
  50: [
    `Never stop asking Al-Qādir because something feels too far away or impossible. Continue to make duʿāʾ for as long as you live. His ability has no limitation, only His wisdom in timing.`,
    `When you witness Al-Qādir's power in one area of life, let it renew your hope in another, just as Zakariyyā did. His mercy in one matter is a sign of His ability in all matters.`,
    `Balance trust in Al-Qādir with personal responsibility. Quran teaches that some outcomes trace back to our own choices, not a limitation in His power. Take the means, then trust the outcome to Him`
  ],
  51: [
    `When you feel small before someone powerful, remind yourself they are fully under Al-Qahir. No one has power except what He allows them.`,
    `Do not fear creation more than the Creator. The One above all of them is the only One worth truly fearing.`,
    `Hand your affairs to Al-Qahir with trust. Being under the control of the All-Wise and All-Aware is the safest place to be.`
  ],
  52: [
    `Recite Subbūḥun Quddūsun Rabbul-malāʾikati war-rūḥ in your rukūʿ and sujūd, just as the Prophet did. It connects your most humble physical posture to the most exalted description of Allah.`,
    `End your witr prayer with SubḥānAllāhi al-Malikil Quddūs, elongating the final repetition as the Prophet did, closing your night prayer with a direct affirmation of His purity.`,
    `Pursue purity of heart through tawbah rather than self-perfection. You will never reach Al-Quddūs's level, but turning back to Him repeatedly is how a servant draws near to holiness.`
  ],
  53: [
    `Pray ṣalāt al-istikhārah before any decision, consulting Al-Qadīr to choose what is best for your dīn and your life, in this world and the next.`,
    `Increase your istighfār, especially in times of distress. The hadith above ties seeking forgiveness directly to Al-Qadīr opening a way out of hardship.`,
    `When facing something that feels impossible, remember His power over creation and resurrection. If He can bring life from nothing, no situation in your life is beyond His ability to change.`
  ],
  54: [
    `Make duʿāʾ with the certainty that Al-Qarīb is genuinely near, not distant or detached. Qur'an 2:186 is Allah answering directly, in the first person, with no intermediary required.`,
    `Pair seeking forgiveness with calling on Al-Qarīb, following the example of Ṣāliḥ. His nearness and His responsiveness to repentance are mentioned together.`,
    `In ṣalāh, especially in sujūd, speak to Al-Qarīb as though He is truly close, because He is. Empty your heart to Him rather than rushing through the motions.`
  ],
  55: [
    `Say Lā ḥawla wa lā quwwata illā billāh often, especially in moments of helplessness. It is a direct acknowledgment that all real power belongs to Al-Qawiyy alone.`,
    `Strive to be the strong believer the Prophet described - in faith, in determination, in standing up for what is right, while recognising the strength itself comes from Al-Qawiyy.`,
    `When you feel powerless against an injustice or overwhelmed by a difficulty, remember that Al-Qawiyy aids those who support His cause. Take the action available to you and trust His support for the rest.`
  ],
  56: [
    `Recite the duʿāʾ above when facing an overwhelming enemy, fear, or opposition. It joins His total dominance with His mercy and forgiveness in one supplication.`,
    `Remember that no one is too powerful beyond the power of Allah's aid, however mighty they appear, holds power independent of Al-Qahhār's permission. Reflect and reach out to Allah in times of overwhelming despair.`,
    `Take confidence, not fear, from this Name when you stand for what is right. Qur'an 3:160 promises that if Al-Qahhār aids you, nothing can overcome you.`
  ],
  57: [
    `Say Allāhu Akbar with reflection rather than habit, especially when entering ṣalāh. You are declaring that nothing competing for your attention is greater than Al-Kabīr.`,
    `Guard against pride. Greatness belongs only to Al-Kabīr; humility belongs to His servants.`,
    `When you feel small or insignificant in this world, remember Al-Kabīr created you with care and perfected your form. Your worth comes from your relationship to Him, not worldly comparison.`
  ],
  58: [
    `Raise your hands in dua with confidence. Al-Karim is too generous to send you away with nothing.`,
    `Be generous yourself, and give without reminding people of it. The noble giving of Al-Karim is the model to copy.`,
    `Seek knowledge as a way to honour the One who taught by the pen. His first generosity to us was teaching.`
  ],
  59: [
    `When you face a setback, hold space for the possibility that Al-Laṭīf is working in a way you cannot yet see. Yūsuf did not understand his trials until the very end of his story.`,
    `Treat people with gentleness in your speech and actions, reflecting the quality Al-Laṭīf loves and rewards above severity.`,
    `Look back over difficult chapters in your own life and notice the subtle threads connecting them to good. This practice strengthens trust in Al-Laṭīf for the chapters still being written.`
  ],
  60: [
    `When you feel fear or insecurity, call directly upon Al-Muʾmin: "O Allah, You are Al-Muʾmin, protect me, give me security, and let my faith not waver." Use this Name in your duʿāʾ explicitly, especially in moments of threat or anxiety.`,
    `Be a source of security for others. The Prophet tied entry to Paradise to your neighbour feeling safe from you. Reflect Al-Muʾmin in how people experience your presence.`,
    `Stand up against injustice when you witness it. Al-Muʾmin is the source of true justice, and reflecting that quality means refusing to stay silent when others are wronged`
  ],
  61: [
    `Keep your idea of Allah high and pure. Whenever a small or wrong thought about Him comes, remember Al-Mutaali is far above it.`,
    `Rise above petty exchanges with people. Keep family ties and do good even to those who cut you off, reaching for the higher way.`,
    `Let His exaltedness keep you humble. Beside Al-Mutaali, there is no reason for pride.`
  ],
  62: [
    `Take this Name as a direct warning against arrogance in your own heart. Reflect on Iblīs and Firʿawn both convinced of their own greatness, both humiliated completely.`,
    `Seek refuge from arrogant people the way Mūsā did: "I have sought refuge in my Lord and your Lord from every arrogant one." Use this when dealing with tyranny or pride in others.`,
    `Recognise whatever greatness you possess: skill, knowledge, status, as entirely borrowed from Al-Mutakabbir. The moment you believe it is your own, you stand on the same fault line as Iblīs.`
  ],
  63: [
    `Memorise and use the duʿāʾ above regularly, not only when you feel spiritually shaky. Ask Al-Matīn directly for firmness in your faith.`,
    `When provision feels uncertain, remember Qur'an 51:58. Ar-Razzāq's giving is backed by Al-Matīn's unshakeable strength. Your rizq is not as fragile as it may feel.`,
    `When injustice appears to be winning, remember His plan is firm. Outcomes that seem delayed are not outcomes that have failed.`
  ],
  64: [
    `Make duʿāʾ persistently rather than giving up after a single request goes unanswered in your expected timeframe. ʿUmar (RA) said he focused on the act of asking, trusting the response would come with it.`,
    `Take a small step toward Al-Mujīb , in worship, in returning to Him after sin, in sincerity and trust that His response will exceed your effort, just as described in the hadith above.`,
    `Be responsive to others as Al-Mujīb is responsive to you. Accept invitations graciously and do not turn away those who ask for help, mirroring the quality you call upon Him with.`
  ],
  65: [
    `Recite the Durūd Ibrāhīm in your tashahhud with presence, recognising you are calling directly upon Al-Majīd by Name multiple times a day.`,
    `Reflect on the Qur'an as majīd (glorious). Approach your daily reading with the awareness that you are engaging with something carrying His own honour.`,
    `Work to bring together excellence in your own character rather than excelling in only one area. Al-Majīd's perfection is whole, let that inspire balanced growth in your worship and conduct.`
  ],
  66: [
    `When you feel surrounded by a difficult situation, remember Al-Muḥīṭ surrounds that very situation more completely than it surrounds you.`,
    `Recite Āyat al-Kursī after every obligatory prayer and reflect specifically on the phrase about His knowledge having no limit. Let this dissolve the illusion that your own knowledge or worry can grasp more than He already holds.`,
    `When facing an opponent or enemy who feels overwhelming, recall Qur'an 85:20, Allah is encompassing them from behind, a position of complete oversight and control.`
  ],
  67: [
    `When you look at your own reflection, recognise it as the direct work of Al-Muṣawwir, not a random outcome. Let it humble your self-criticism.`,
    `Reflect on the diversity of human faces and languages as direct signs of Al-Muṣawwir's artistry. Appreciate variation in others rather than imposing a single standard of beauty.`,
    `Follow Sulaymān's example: when given a unique gift or ability, respond with gratitude and righteous use of it, not pride in your own uniqueness.`
  ],
  68: [
    `Take the means available to you, then leave the outcome entirely to Al-Muqtadir. Tie the camel, then trust; effort and reliance are not opposites.`,
    `When you fear an oppressor escaping justice, remember no one is beyond His reach. His grip is complete.`,
    `Recognise that any success you experience is tawfīq from Al-Muqtadir, not your own doing. This protects against both arrogance in victory and despair in setback.`
  ],
  69: [
    `Recognise Al-Muqīt's hand in every meal that reaches you. A brief moment of awareness before eating transforms a routine act into remembrance.`,
    `Seek spiritual nourishment as deliberately as physical nourishment. Set aside time for dhikr and Qur'an the way you set aside time for meals.`,
    `Trust Al-Muqīt's timing in provision. The hadith above promises your rizq will reach you in full, even if slowly - this should ease anxious striving without negating honest effort.`
  ],
  70: [
    `Recite the dhikr above after witr (Subḥāna al-Malikil Quddūs) connecting your night prayer directly to His kingship.`,
    `Hold any authority you have over others: at work, at home with the awareness that you are answerable to Al-Malik for how you use it.`,
    `When worldly power or status intimidates you, remember the Day Al-Malik will ask: where are the kings of the earth now? Their power was always on loan`
  ],
  71: [
    `Reflect on Qur'an 54:55 as a description of the ultimate goal: being brought near to Al-Malīk Himself.`,
    `When you receive any blessing, remember it was decreed specifically by Al-Malīk for you. Let this increase your gratitude.`,
    `Trust that Al-Malīk's rule over your affairs is active and complete. Nothing in your situation is outside His effective decree.`
  ],
  72: [
    `Memorise and use the phrase ni'mal Mawlā wa ni'man-Naṣīr in your daily reflection. Both occurrences in the Qur'an follow a command to strive in His path.`,
    `Strive actively in something that matters to your deen: calling others to good, standing for justice and trust that Al-Mawlā's support follows genuine effort.`,
    `In moments needing protection or backup, turn to Al-Mawlā first before seeking help elsewhere. He is described as the best of supporters.`
  ],
  73: [
    `Practise watching your own thoughts the way Al-Muhaymin watches over creation, observing without identifying with every passing negative thought.`,
    `Trust that what you conceal in your heart, even from those closest to you, is fully known and accounted for by Al-Muhaymin. This is both a comfort and an accountability.`,
    `Approach the Qur'an knowing Al-Muhaymin Himself is a witness to its truth and read it with the confidence that nothing in it requires external verification.`
  ],
  74: [
    `When facing any opposition or difficulty, ask An-Naṣīr directly for help rather than relying solely on your own strength or other people's support.`,
    `Support Allah's cause through your own actions: defending the truth, helping those who are wronged, following the principle that aiding His religion brings His aid to you.`,
    `Remember that what looks like loss in this world, as with the believers of the trench, can be the deepest victory in the sight of An-Naṣīr.`
  ],
  75: [
    `Recite and reflect on the shahādah with full presence, recognising it as your personal declaration of Al-Wāḥid's absolute oneness.`,
    `When you turn to Him in duʿāʾ, address Him alone, without dividing your hope between Him and other sources of help.`,
    `Remember the pairing with Al-Qahhār no matter how much status or power a person accumulates, they remain beneath the One who is truly singular and supreme.`
  ],
  76: [
    `Hold your possessions lightly. They are on loan and will return to Al-Warith, so use them for good while you have them.`,
    `When you lose someone or something, say Inna lillahi wa inna ilayhi rajiun. You are handing it back to the One who inherits all.`,
    `Invest in what outlasts you, good deeds and lasting charity, since worldly things all return to Him in the end.`
  ],
  77: [
    `When you feel boxed in by your circumstances, remember wherever you turn is still within the vastness of Al-Wāsiʿ. No situation is outside His reach.`,
    `Counter fear of scarcity with the promise of vastness. When Shayṭān whispers fear of poverty, recall that Al-Wāsiʿ's bounty has no limit.`,
    `Never let the size of your sin convince you forgiveness is out of reach. Al-Wāsiʿ's mercy is genuinely without boundary for the one who returns to Him.`
  ],
  78: [
    `Pursue the actions the Prophet identified as beloved to Allah: constant repentance, purification, following his example as a direct path to being loved by Al-Wadūd.`,
    `Believe genuinely that you are loved despite your flaws. Al-Wadūd's love is paired with His mercy and forgiveness, not conditioned on your perfection.`,
    `Show gentleness to others, since the Prophet said Allah is gentle and loves gentleness, rewarding it in ways harshness is never rewarded.`
  ],
  79: [
    `Say Ḥasbunallāhu wa niʿmal Wakīl in moments of fear or overwhelming odds, exactly as the companions did facing a much larger army.`,
    `Take the practical steps available to you, then consciously hand the outcome to Al-Wakīl. Effort and reliance work together.`,
    `When anxious thoughts about the future arise, remind yourself that Al-Wakīl already has angels assigned to protect your affairs by His decree.`
  ],
  80: [
    `Follow the path described in the hadith above. Start with what is obligatory, then increase in voluntary acts of worship to draw closer to Al-Walī as your protecting friend.`,
    `Recite Yūsuf's duʿāʾ in moments of hardship: "You are my Walī in this world and the Hereafter." It is a complete declaration of trust through trial.`,
    `Choose your true allegiance carefully. Qur'an 2:257 makes clear there are only two directions - toward Al-Walī and into light, or toward false guardians and into darkness`
  ],
  81: [
    `Use Sulaymān's duʿāʾ when asking for something significant and unique to your life, calling directly on Al-Wahhāb by Name.`,
    `Reflect regularly on the gifts you never asked for - your senses, your health, your ability to think and feel. Counting these increases gratitude and softens the heart toward Al-Wahhāb.`,
    `Give gifts to others without expecting return, mirroring the purity of Al-Wahhāb's giving. The Prophet said this creates love between people.`
  ],
  82: [
    `Do things beautifully, your prayer, your work, your dealings with people. Al-Jamil loves beauty, so give your actions care.`,
    `Keep yourself and your surroundings clean and pleasant. Loving beauty is part of loving Al-Jamil.`,
    `Let every beautiful thing you see turn your heart to its source. Say SubhanAllah and remember the beauty of Al-Jamil behind it.`
  ],
  83: [
    `Give from what you have, even when it is little. You are copying a quality Al-Jawād loves, and He will not let your giving decrease you.`,
    `Ask Him boldly. You are asking the Most Generous, whose treasures never run low so never make your requests small.`,
    `When someone is generous to you, thank them, and remember the true source of that kindness is Al-Jawād.`
  ],
  84: [
    `When you experience injustice with no earthly remedy, entrust the matter to Al-Ḥakam rather than carrying bitterness or seeking revenge.`,
    `Turn to revealed guidance as the standard for judging right and wrong in your own life.`,
    `Trust that even hidden wrongs that is the things no human court could ever know are fully within the knowledge of Al-Ḥakam and will be judged with complete justice.`
  ],
  85: [
    `Raise your hands in duʿāʾ with full confidence, recalling this hadith directly. Al-Ḥayiyy's character inclines toward giving, not withholding.`,
    `When you sin privately, trust that Al-Ḥayiyy's modesty covers it rather than exposing it, and use that mercy as motivation to repent rather than an excuse to continue.`,
    `Extend the same quality to others, cover their faults rather than exposing them, reflecting the modesty and dignity of Al-Ḥayiyy in your own conduct.`
  ],
  86: [
    `Recite Sūrat al-Fātiḥah with attention to the word Rabb, recognising you are addressing the Nurturer of all the worlds, not a distant ruler.`,
    `In your most personal duʿāʾ, follow the example of the prophets and address Him as Rabbī (my Lord ) emphasising the closeness this Name carries.`,
    `Reflect on the favours Ar-Rabb has raised you with throughout your life, even the ones you never directly asked for.`
  ],
  87: [
    `Practise gentleness deliberately in your speech and actions, especially with those who frustrate you, mirroring the character Ar-Rafīq loves and rewards.`,
    `Accept that growth in your own faith and character happens in stages. Allow yourself the same gentleness Ar-Rafīq extends in His own creating.`,
    `Replace harshness with patience in your dealings with family and those under your care, following the hadith's direct link between gentleness and the good in a person.`
  ],
  88: [
    `Recite this exact dhikr in your rukūʿ and sujūd, as the Prophet did, with awareness of what each word affirms about Al-Subbūḥ's perfection.`,
    `Increase general tasbīḥ, saying SubḥānAllāh throughout your day as a direct response to knowing As-Subbūḥ's complete freedom from flaw.`,
    `Let the angels' non-stop praise inspire you to remember Him steadily, not only when you are in need.`
  ],
  89: [
    `When you feel pulled to treat a powerful person as if they were everything, remember that true mastery belongs only to As-Sayyid.`,
    `Reflect on your own complete dependence on As-Sayyid, regardless of whatever status or independence you may feel you have achieved in this world.`,
    `Use titles and honour for people with appropriate humility, following the Prophet's correction that ultimate sayyid-ship belongs to Allah alone.`
  ],
  90: [
    `Use the Prophet's duʿāʾ when you or someone you love is ill, placing your hand on the place of pain as he did, and asking Ash-Shāfī for a full cure.`,
    `Take medicine and see the doctor as a means, while keeping your heart's trust on Ash-Shāfī as the real Healer.`,
    `Ask Him to heal your heart, grief, worry and inner wounds are just as much within His power`
  ],
  91: [
    `Ensure your earnings and what you give in charity are lawfully and purely obtained, since Aṭ-Ṭayyib accepts only what is itself pure.`,
    `Keep your body, clothes, and home clean, as a real, everyday way of valuing what He loves.`,
    `Choose clean, kind speech and good company, remembering His standard reaches beyond the body into character.`
  ],
  92: [
    `When provision is tight, do not despair or blame yourself harshly. Trust that Al-Qabid is holding back with wisdom, and keep asking Him.`,
    `Balance your hope with humility. He withholds and He gives, so stay patient in the lean times and grateful in the full ones.`,
    `Look for the mercy hidden in the restriction. Sometimes what Al-Qabid holds back from you is protecting you.`
  ],
  93: [
    `When blessed with plently, increase in gratitude and generosity rather than attributing the increase solely to your own skill or effort.`,
    `Ask Al-Bāsiṭ directly to expand your provision, your patience, and your understanding, recognising His extending is not limited to material wealth.`,
    `Hold both expansion and constriction with equanimity, knowing both come from the same wise and kind source.`
  ],
  94: [
    `In times of ease and plenty, thank Al-Basit and remember it is His gift. Do not let abundance make you heedless.`,
    `When your life feels tight, ask Al-Basit to open it. The One who extends provision can widen what feels narrow.`,
    `Use the abundance He extends for good. Open times are a chance to give, since Al-Basit gave to you first.`
  ],
  95: [
    `When your duʿāʾ feels unanswered, consider that Al-Muʾakhkhir may simply be delaying it for reasons of wisdom, not denying it outright.`,
    `Be patient with your own timeline of growth and achievement, trusting that what is delayed by Al-Muʾakhkhir is delayed for good reason.`,
    `Avoid envy toward those who seem to move ahead of you; both going first and delay are equally placed by perfect wisdom.`
  ],
  96: [
    `Strive for iḥsān, excellence in your own worship and daily actions, taking Al-Muḥsin's perfection as the standard you aim toward, however imperfectly.`,
    `When something in your life feels flawed or wasted, trust that Al-Muḥsin's decree for you carries a hidden perfection not yet visible.`,
    `Notice the beauty and precision in creation around you as a direct sign pointing back to Al-Muḥsin's perfect action.`
  ],
  97: [
    `When you receive something good, attribute it directly to Al-Muʿṭī rather than solely to your own effort or the kindness of the person who delivered it.`,
    `Ask generously and specifically, trusting that Al-Muʿṭī's giving is not constrained by what feels reasonable to ask.`,
    `When something is withheld despite your best effort, trust that no human power could have given it anyway if Al-Muʿṭī did not will it.`
  ],
  98: [
    `Use this name in your dua, calling on the Bestower of great favours. The Prophet linked it to the Greatest Name, by which He gives.`,
    `Count the large favours of Al-Mannan you never earned, and let them turn your heart to gratitude.`,
    `Give generously to others as He gives to you, without making them feel small for receiving it.`
  ],
  99: [
    `Never miss witr prayer, understanding it as a direct, physical reflection of Al-Witr's oneness woven into your nightly worship.`,
    `Let this final Name draw together everything learned from the previous ninety-eight: every attribute of greatness, mercy, power, and beauty belongs to a single, undivided, peerless Being.`,
    `End each day's reflection on the Names with the same affirmation that opened it (lā ilāha illallāh) recognising Al-Witr as the truth every other Name ultimately serves.`
  ]
};

const getReflectionAnswers = (nameObj) => {
  if (!nameObj) return [];
  const cardNum = nameObj.number || nameObj.id;
  let rawList = [];
  if (REFLECTION_ANSWERS_MAP[cardNum]) {
    rawList = REFLECTION_ANSWERS_MAP[cardNum];
  } else if (nameObj.practicalWays && Array.isArray(nameObj.practicalWays) && nameObj.practicalWays.length > 0) {
    rawList = nameObj.practicalWays.map(way => {
      let str = typeof way === 'object' ? (way.view || way.text || '') : String(way);
      return str.replace(/ﷺ/g, '').replace(/\s+/g, ' ').trim();
    }).filter(Boolean);
  } else {
    rawList = [
      `Reflect upon how ${nameObj.transliteration || nameObj.tr || nameObj.name || 'this Name'} impacts your daily life and heart.`,
      `Incorporate the meaning of ${nameObj.transliteration || nameObj.tr || nameObj.name || 'this Name'} into your daily dhikr and duʿāʾ.`
    ];
  }

  return rawList.map(ans => String(ans).replace(/\.\s+(?=\S)/g, '.\n').trim());
};

const NameDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { name, initialStepIndex = 0, draftProgress } = route.params;
  const { markAsLearned, masteredIds, revisitCounts, userReflections, incrementReadingTime, markAsDraft, removeDraft, reviewLaterIds, toggleReviewLater, isSubscribed } = useNames();
  const { favouriteIds, toggleFavourite } = usePlaylist();
  const isFocused = useIsFocused();
  const { isDark, themeMode } = useAppTheme();

  useEffect(() => {
    const cardNumber = Number(name?.number || name?.id);
    if (cardNumber > 5 && !isSubscribed) {
      Alert.alert(
        "Full Access Pass Required",
        "Cards 6 to 99 require an active 30-Day Full Access Pass. Unlock all 99 cards to continue learning!",
        [
          { text: "Cancel", onPress: () => navigation.goBack(), style: "cancel" },
          { text: "Get Access Pass", onPress: () => navigation.replace('Subscription') }
        ]
      );
    }
  }, [name, isSubscribed]);
  const [readingSettingsVisible, setReadingSettingsVisible] = useState(false);
  const isMastered = masteredIds ? masteredIds.includes(name.id) : false;
  const isFavorite = favouriteIds ? favouriteIds.has(name.number || name.id) : false;
  const isReviewLater = reviewLaterIds ? reviewLaterIds.includes(name.number || name.id) : false;
  const revisits = revisitCounts[name.id] || 0;
  const isSaturated = isMastered || revisits >= 3;

  // Night-mode / Paper themed colors
  const t = useMemo(() => {
    if (themeMode === 'paper') {
      return {
        cardBg: '#FFFDF9',
        cardBorder: '#E6DCB8',
        text: '#2C221E',
        subText: '#5A4A42',
        dimText: '#8A7A72',
        inputBg: '#FAF6ED',
        inputBorder: 'rgba(5,150,105,0.30)',
        safeBg: '#FAF6ED',
        progressTrack: '#F4ECD8',
        pillText: '#2C221E',
        optionBg: '#FFFDF9',
        notebookLeft: '#F4ECD8',
        notebookBorder: '#D6CCB0',
        ringHole: '#FFFDF9',
        pastBg: 'rgba(5,150,105,0.12)',
        journeyCardBg: '#FFFDF9',
        journeyGrad: ['#FAF6ED', '#FFFDF9'],
        statusBg: '#FFFDF9',
      };
    }
    return isDark ? {
      cardBg: '#1A2332',
      cardBorder: 'rgba(0,173,193,0.20)',
      text: '#E8EDF2',
      subText: '#9EAAB8',
      dimText: '#6B7A8D',
      inputBg: '#0F1923',
      inputBorder: 'rgba(0,173,193,0.30)',
      safeBg: '#0F172A',
      progressTrack: '#1E293B',
      pillText: '#C5F2F7',
      optionBg: '#1A2332',
      notebookLeft: '#142030',
      notebookBorder: 'rgba(0,173,193,0.25)',
      ringHole: '#0F1923',
      pastBg: 'rgba(0,173,193,0.12)',
      journeyCardBg: '#1A2332',
      journeyGrad: ['#0F172A', '#1A2332'],
      statusBg: '#1A2332',
    } : {
      cardBg: '#FFFFFF',
      cardBorder: '#DFF6F8',
      text: '#1A1A1A',
      subText: '#3A3A3A',
      dimText: '#7A7A7A',
      inputBg: '#FFFFFF',
      inputBorder: 'rgba(0,173,193,0.25)',
      safeBg: '#F8FAFC',
      progressTrack: '#FFFFFF',
      pillText: '#1A1A1A',
      optionBg: '#FFFFFF',
      notebookLeft: '#F0FAFC',
      notebookBorder: '#A0E4EC',
      ringHole: '#FFFFFF',
      pastBg: 'rgba(0,173,193,0.07)',
      journeyCardBg: '#FFFFFF',
      journeyGrad: ['#E8F7FB', '#FFFFFF'],
      statusBg: '#FFFFFF',
    };
  }, [isDark, themeMode]);

  // Determine if this is a Qur'anic name or Sunnah name
  // The first 81 are Qur'anic, the last 18 are Sunnah. We can also check if quranic array exists and has items.
  const isSunnah = name.sunnah && name.sunnah.length > 0 && (!name.quranic || name.quranic.length === 0);
  const categoryPillText = isSunnah ? 'Sunnah' : "Qur'anic";

  // Build the dynamic steps array
  const steps = useMemo(() => {
    const s = [];    // 1. Meaning Step
    s.push({ type: 'meaning' });

    // 2. Gifts Step (Moved right after Meaning as requested)
    if (name.gifts && name.gifts.length > 0) {
      s.push({ type: 'gifts' });
    }

    // 3. Qur'an References
    if (name.quran && name.quran.length > 0) {
      const formattedRefs = name.quran.map((ref) => {
        if (typeof ref === 'string') return ref;
        return {
          arabic: ref?.ar,
          simpleMeaning: ref?.tr,
          reference: ref?.ref,
          significance: ref?.whyThisVerse || ref?.significance
        };
      });
      s.push({ type: 'quran', data: formattedRefs });
    } else if (name.quranic && name.quranic.length > 0) {
      s.push({ type: 'quran', data: name.quranic });
    }

    // 4. Hadith / Sunnah References
    if (name.hadith && name.hadith.length > 0) {
      const formattedRefs = name.hadith.map((ref) => {
        if (typeof ref === 'string') return ref;
        return {
          arabic: ref?.ar,
          simpleMeaning: ref?.tr,
          reference: ref?.ref,
          significance: ref?.whyThisVerse || ref?.significance
        };
      });
      s.push({ type: 'hadith', data: formattedRefs });
    } else if (name.sunnah && name.sunnah.length > 0) {
      s.push({ type: 'hadith', data: name.sunnah });
    }
    if (name.practicalWays && name.practicalWays.length > 0) {
      s.push({ type: 'practical' });
    }


    s.push({ type: 'reflection' });
    return s;
  }, [name, isSunnah, revisits, isSaturated]);

  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    const clamped = Math.max(0, Math.min(initialStepIndex, steps.length - 1));
    return clamped;
  });
  const [phase, setPhase] = useState('content'); // 'content' | 'journey'
  const [masteryAnswer, setMasteryAnswer] = useState(null);
  const [masteryDone, setMasteryDone] = useState(false);
  const [meaningSubStep, setMeaningSubStep] = useState(draftProgress?.meaningSubStep ?? -1);
  const [refSubStep, setRefSubStep] = useState(draftProgress?.refSubStep ?? -1);
  const [showArabicVerse, setShowArabicVerse] = useState(false);
  const [giftSubStep, setGiftSubStep] = useState(draftProgress?.giftSubStep ?? -1);
  const [practicalSubStep, setPracticalSubStep] = useState(draftProgress?.practicalSubStep ?? -1);
  const [scholarSubStep, setScholarSubStep] = useState(draftProgress?.scholarSubStep ?? -1);

  const [reflection1, setReflection1] = useState('');
  const [reflection2, setReflection2] = useState('');
  const [reflection3, setReflection3] = useState('');
  const [reflectionSubStep, setReflectionSubStep] = useState(draftProgress?.reflectionSubStep ?? 0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollViewRef = useRef(null);
  const readingCardScrollRef = useRef(null);
  const lastReadTimerRef = useRef(null);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const triggerFlip = useCallback((callback) => {
    Animated.timing(flipAnim, {
      toValue: 90,
      duration: 250,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      callback();
      flipAnim.setValue(-90);
      Animated.timing(flipAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  }, [flipAnim]);

  const chromeOpacity = useRef(new Animated.Value(1)).current;
  const [isChromeVisible, setIsChromeVisible] = useState(true);

  // Persist reading position and mark as draft
  useEffect(() => {
    const nameNumber = name.number || name.id;
    if (phase === 'journey') {
      return;
    }

    AsyncStorage.setItem('last_reading_progress', JSON.stringify({
      nameNumber,
      stepIndex: currentStepIndex,
      timestamp: Date.now(),
    })).catch(() => { });

    AsyncStorage.setItem(`draft_progress_${nameNumber}`, JSON.stringify({
      stepIndex: currentStepIndex,
      meaningSubStep,
      giftSubStep,
      refSubStep,
      practicalSubStep,
      scholarSubStep,
      reflectionSubStep
    })).catch(() => { });

    // Debounce backend sync: only POST after the user settles on a step for 3s
    if (lastReadTimerRef.current) clearTimeout(lastReadTimerRef.current);
    lastReadTimerRef.current = setTimeout(() => {
      http.post('/api/me/last-read', { nameNumber, stepIndex: currentStepIndex }).catch(() => { });
    }, 3000);

    const hasStarted = currentStepIndex > 0 || meaningSubStep > -1 || giftSubStep > -1 || refSubStep > -1 || practicalSubStep > -1 || scholarSubStep > -1;
    if (hasStarted && phase === 'content' && !isMastered) {
      markAsDraft(nameNumber);
    }

    return () => {
      if (lastReadTimerRef.current) clearTimeout(lastReadTimerRef.current);
    };
  }, [currentStepIndex, meaningSubStep, giftSubStep, refSubStep, practicalSubStep, scholarSubStep, reflectionSubStep, name, phase, markAsDraft]);

  const isBackDisabled = useMemo(() => {
    if (currentStepIndex === 0 && meaningSubStep === -1) return true;
    return false;
  }, [currentStepIndex, meaningSubStep]);

  // Active reading timer
  useEffect(() => {
    if (!isFocused) return;
    const interval = setInterval(() => {
      incrementReadingTime(5);
    }, 5000);
    return () => clearInterval(interval);
  }, [isFocused, incrementReadingTime]);

  const safeStepIndex = Math.max(0, Math.min(currentStepIndex, steps.length - 1));
  const currentStep = steps[safeStepIndex];

  // The name header + step tracker start visible on each card, then fade
  // fully away after a few seconds so the reading card gets the full screen.
  // Bottom nav (Previous/Continue) is never affected — swipe navigation
  // must always stay reachable.
  useEffect(() => {
    chromeOpacity.setValue(1);
    setIsChromeVisible(true);
    const timer = setTimeout(() => {
      setIsChromeVisible(false);
      Animated.timing(chromeOpacity, { toValue: 0, duration: 350, useNativeDriver: true }).start();
    }, 3000);
    return () => clearTimeout(timer);
  }, [safeStepIndex, chromeOpacity]);

  // Circle progress ring animation state and effect
  const [ringProgress, setRingProgress] = useState(0);
  const ringProgressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const totalSections = steps.length || 1;
    const targetProgress = (safeStepIndex + 1) / totalSections;

    const listenerId = ringProgressAnim.addListener(({ value }) => {
      setRingProgress(value);
    });

    Animated.timing(ringProgressAnim, {
      toValue: targetProgress,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    return () => {
      ringProgressAnim.removeListener(listenerId);
    };
  }, [safeStepIndex, steps.length]);

  // Solar system continuous orbital rotation
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 12000, // 12 seconds per full orbit
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const calculatedProgress = useMemo(() => {
    if (!steps || steps.length === 0) return 0;
    let totalSubsteps = 0;
    let completedSubsteps = 0;

    steps.forEach((step, idx) => {
      let stepTotal = 1;
      let stepCompleted = 0;

      if (step.type === 'meaning') {
        const sentences = getMeaningSentences(name);
        stepTotal = sentences.length;
        if (idx < safeStepIndex) {
          stepCompleted = stepTotal;
        } else if (idx === safeStepIndex) {
          stepCompleted = meaningSubStep === -1 ? 0 : meaningSubStep + 1;
        }
      } else if (step.type === 'quran' || step.type === 'hadith') {
        const refsCount = Array.isArray(step.data) ? step.data.length : 1;
        stepTotal = refsCount;
        if (idx < safeStepIndex) {
          stepCompleted = stepTotal;
        } else if (idx === safeStepIndex) {
          stepCompleted = refSubStep === -1 ? 0 : refSubStep + 1;
        }
      } else if (step.type === 'gifts') {
        const giftsCount = name.gifts ? name.gifts.length : 1;
        stepTotal = giftsCount;
        if (idx < safeStepIndex) {
          stepCompleted = stepTotal;
        } else if (idx === safeStepIndex) {
          stepCompleted = giftSubStep === -1 ? 0 : giftSubStep + 1;
        }
      } else if (step.type === 'practical') {
        const waysCount = name.practicalWays ? name.practicalWays.length : 1;
        stepTotal = waysCount;
        if (idx < safeStepIndex) {
          stepCompleted = stepTotal;
        } else if (idx === safeStepIndex) {
          stepCompleted = practicalSubStep === -1 ? 0 : practicalSubStep + 1;
        }
      } else if (step.type === 'scholarly') {
        const viewsCount = name.scholarlyViews ? name.scholarlyViews.length : 1;
        stepTotal = viewsCount;
        if (idx < safeStepIndex) {
          stepCompleted = stepTotal;
        } else if (idx === safeStepIndex) {
          stepCompleted = scholarSubStep === -1 ? 0 : scholarSubStep + 1;
        }
      } else if (step.type === 'reflection') {
        stepTotal = 1;
        if (idx < safeStepIndex) {
          stepCompleted = stepTotal;
        } else if (idx === safeStepIndex) {
          stepCompleted = reflection1 ? 1 : 0;
        }
      } else if (step.type === 'mastery') {
        stepTotal = 1;
        if (idx < safeStepIndex) {
          stepCompleted = stepTotal;
        } else if (idx === safeStepIndex) {
          stepCompleted = masteryDone ? 1 : 0;
        }
      }

      totalSubsteps += stepTotal;
      completedSubsteps += stepCompleted;
    });

    if (totalSubsteps === 0) return 0;
    return Math.min(1, Math.max(0, completedSubsteps / totalSubsteps));
  }, [steps, safeStepIndex, meaningSubStep, refSubStep, giftSubStep, practicalSubStep, scholarSubStep, reflectionSubStep, masteryDone, name]);

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: calculatedProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [calculatedProgress]);

  useEffect(() => {
    if (currentStepIndex !== safeStepIndex) {
      setCurrentStepIndex(safeStepIndex);
    }
  }, [currentStepIndex, safeStepIndex]);

  const isSlideDisabled = useMemo(() => {
    if (!currentStep) return false;
    if (currentStep.type === 'mastery') {
      const correctAns = name.mcq && name.mcq.length > 0 ? name.mcq[0].ans : 0;
      return !masteryDone || masteryAnswer !== correctAns;
    }
    if (currentStep.type === 'reflection') {
      return !reflection1;
    }
    return false;
  }, [currentStep, masteryDone, masteryAnswer, name.mcq, reflection1, reflection2, reflection3]);

  // Animations
  const exitAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  const slidePanX = useRef(new Animated.Value(0)).current;
  const handAnim = useRef(new Animated.Value(0)).current;
  const slideBtnScale = useRef(new Animated.Value(1)).current;
  const handLoopRef = useRef(null);

  const journeyOpacity = useRef(new Animated.Value(0)).current;
  const journeyTranslate = useRef(new Animated.Value(50)).current;

  const handleClose = useCallback(() => {
    Animated.timing(exitAnim, {
      toValue: Dimensions.get('window').height,
      duration: 350,
      useNativeDriver: true,
      easing: Easing.out(Easing.poly(4)),
    }).start(() => {
      navigation.goBack();
    });
  }, [exitAnim, navigation]);

  useEffect(() => {
    handLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(handAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.delay(200),
        Animated.timing(handAnim, { toValue: 0, duration: 400, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.delay(300),
      ])
    );
    handLoopRef.current.start();
    return () => { handLoopRef.current?.stop(); handAnim.setValue(0); };
  }, [handAnim]);

  // Smoothly scroll to active reflection input when keyboard opens
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const subShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      if (currentStep?.type === 'reflection') {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd?.({ animated: true });
        }, 50);
      }
    });

    const subHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [currentStep]);

  const goToStep = useCallback((index) => {
    if (index < 0 || index >= steps.length) return;

    // Update state instantly so the outer card remains fixed
    // The FadeContent component inside will handle the text cross-fading
    setCurrentStepIndex(index);
    setMeaningSubStep(-1);
    setRefSubStep(-1);
    setShowArabicVerse(false);
    setGiftSubStep(-1);
    setPracticalSubStep(-1);
    setScholarSubStep(-1);
    setReflection1('');
    setReflection2('');
    setReflection3('');
    setReflectionSubStep(0);
  }, [steps.length]);

  const goNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      triggerFlip(() => {
        goToStep(currentStepIndex + 1);
      });
    }
  }, [currentStepIndex, steps.length, goToStep, triggerFlip]);

  const goPrev = useCallback(() => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    if (currentStep.type === 'meaning' && meaningSubStep > -1) {
      if (meaningSubStep === 0) {
        triggerFlip(() => setMeaningSubStep(-1));
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMeaningSubStep(prev => prev - 1);
      }
      return;
    } else if ((currentStep.type === 'quran' || currentStep.type === 'hadith') && refSubStep > -1) {
      if (refSubStep === 0) {
        triggerFlip(() => {
          setRefSubStep(-1);
          setShowArabicVerse(false);
        });
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setRefSubStep(prev => prev - 1);
        setShowArabicVerse(false);
      }
      return;
    } else if (currentStep.type === 'gifts' && giftSubStep > -1) {
      if (giftSubStep === 0) {
        triggerFlip(() => setGiftSubStep(-1));
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setGiftSubStep(prev => prev - 1);
      }
      return;
    } else if (currentStep.type === 'practical' && practicalSubStep > -1) {
      if (practicalSubStep === 0) {
        triggerFlip(() => setPracticalSubStep(-1));
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setPracticalSubStep(prev => prev - 1);
      }
      return;
    } else if (currentStep.type === 'scholarly' && scholarSubStep > -1) {
      if (scholarSubStep === 0) {
        triggerFlip(() => setScholarSubStep(-1));
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setScholarSubStep(prev => prev - 1);
      }
      return;
    }

    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1];
      triggerFlip(() => {
        goToStep(currentStepIndex - 1);
        // Restore the LAST sub-step of the previous section so Previous feels natural
        if (prevStep?.type === 'meaning') {
          const sentences = getMeaningSentences(name);
          setMeaningSubStep(Math.max(0, sentences.length - 1));
        } else if (prevStep?.type === 'quran' || prevStep?.type === 'hadith') {
          const refsCount = Array.isArray(prevStep.data) ? prevStep.data.length : 1;
          setRefSubStep(Math.max(0, refsCount - 1));
        } else if (prevStep?.type === 'gifts') {
          const sents = flattenToSentences(name.gifts);
          setGiftSubStep(Math.max(0, sents.length - 1));
        } else if (prevStep?.type === 'practical') {
          const sents = flattenToSentences(name.practicalWays);
          setPracticalSubStep(Math.max(0, sents.length - 1));
        } else if (prevStep?.type === 'scholarly') {
          const sents = flattenToSentences(name.scholarlyViews);
          setScholarSubStep(Math.max(0, sents.length - 1));
        }
      });
    }
  }, [currentStepIndex, goToStep, steps, meaningSubStep, refSubStep, giftSubStep, practicalSubStep, scholarSubStep, name, triggerFlip]);

  const goJourney = useCallback((reflectionData = null) => {
    const nameNumber = name.number || name.id;
    markAsLearned(name.id, reflectionData);
    removeDraft(nameNumber);
    // Keep last_reading_progress so HomeScreen can detect completion and automatically promote the next draft
    AsyncStorage.removeItem(`draft_progress_${nameNumber}`).catch(() => { });
    setPhase('journey');
    Animated.parallel([
      Animated.timing(journeyOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(journeyTranslate, { toValue: 0, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [markAsLearned, name.id, name.number, journeyOpacity, journeyTranslate, removeDraft]);

  const handleNext = useCallback(() => {
    let ans = 0;
    if (name.mcq && name.mcq.length > 0) ans = name.mcq[0].ans;

    if (currentStep.type === 'mastery') {
      if (masteryDone && masteryAnswer === ans) {
        goJourney();
      }
    } else if (currentStep.type === 'reflection') {
      goJourney({
        q1: reflection1
      });
    } else if (currentStep.type === 'meaning') {
      const sentences = getMeaningSentences(name);
      let nextStep = meaningSubStep + 1;
      while (nextStep < sentences.length && !sentences[nextStep]?.replace(/[.?!\s]/g, '').length) {
        nextStep++;
      }
      if (nextStep < sentences.length) {
        if (meaningSubStep === -1) {
          triggerFlip(() => setMeaningSubStep(nextStep));
        } else {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setMeaningSubStep(nextStep);
        }
      } else {
        goNext();
      }
    } else if (currentStep.type === 'quran' || currentStep.type === 'hadith') {
      const sents = getReferenceSentences(currentStep.data);
      if (refSubStep < sents.length - 1) {
        if (refSubStep === -1) {
          triggerFlip(() => {
            setRefSubStep(prev => prev + 1);
            setShowArabicVerse(false);
          });
        } else {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setRefSubStep(prev => prev + 1);
          setShowArabicVerse(false);
        }
      } else {
        goNext();
      }
    } else if (currentStep.type === 'gifts') {
      const sents = flattenToSentences(name.gifts);
      if (giftSubStep < sents.length - 1) {
        if (giftSubStep === -1) {
          triggerFlip(() => setGiftSubStep(prev => prev + 1));
        } else {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setGiftSubStep(prev => prev + 1);
        }
      } else {
        goNext();
      }
    } else if (currentStep.type === 'practical') {
      const sents = flattenToSentences(name.practicalWays);
      if (practicalSubStep < sents.length - 1) {
        if (practicalSubStep === -1) {
          triggerFlip(() => setPracticalSubStep(prev => prev + 1));
        } else {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setPracticalSubStep(prev => prev + 1);
        }
      } else {
        goNext();
      }
    } else if (currentStep.type === 'scholarly') {
      const sents = flattenToSentences(name.scholarlyViews);
      if (scholarSubStep < sents.length - 1) {
        if (scholarSubStep === -1) {
          triggerFlip(() => setScholarSubStep(prev => prev + 1));
        } else {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setScholarSubStep(prev => prev + 1);
        }
      } else {
        goNext();
      }
    } else {
      goNext();
    }
  }, [goJourney, currentStep.type, masteryDone, masteryAnswer, name.mcq, goNext, refSubStep, giftSubStep, practicalSubStep, scholarSubStep, name.gifts, name.practicalWays, name.scholarlyViews, reflection1, reflection2, reflection3, meaningSubStep, name, currentStep.data, triggerFlip]);



  // ── Render Helpers ──

  const DecorativeFlower = ({ color }) => (
    <Svg width={rs(24)} height={rs(24)} viewBox="0 0 24 24">
      {/* 8-petal geometric flower */}
      <Path d="M12 2 C13 7 17 11 22 12 C17 13 13 17 12 22 C11 17 7 13 2 12 C7 11 11 7 12 2" fill={color} />
      <Path d="M4.9 4.9 C8.4 7 11.2 11.2 12 12 C11.2 12.8 7 15.6 4.9 19.1 C7 15.6 11.2 12.8 12 12 C12.8 11.2 15.6 7 19.1 4.9 C15.6 7 12.8 11.2 12 12" fill={color} />
      <SvgCircle cx="12" cy="12" r="2.5" fill="#FFFFFF" />
    </Svg>
  );

  const BadgeOpenBookIcon = ({ size = rs(48) }) => (
    <Svg width={size} height={size * 0.85} viewBox="0 0 64 54" fill="none">
      {/* Top Sparkles */}
      <Path d="M32 0 L33.8 5.2 L39 7 L33.8 8.8 L32 14 L30.2 8.8 L25 7 L30.2 5.2 Z" fill="#00ADC1" />
      <Path d="M40 8 L40.9 10.3 L43.2 11.2 L40.9 12.1 L40 14.4 L39.1 12.1 L36.8 11.2 L39.1 10.3 Z" fill="#00ADC1" />
      <Path d="M24 9 L24.7 10.8 L26.5 11.5 L24.7 12.2 L24 14 L23.3 12.2 L21.5 11.5 L23.3 10.8 Z" fill="#00ADC1" />

      {/* Book Teal Bottom Spine Base */}
      <Path
        d="M6 24 C 17 20, 29 24, 32 26 C 35 24, 47 20, 58 24 L 58 45 C 47 41, 35 45, 32 47 C 29 45, 17 41, 6 45 Z"
        fill="#00796B"
      />

      {/* White Book Pages Surface */}
      <Path
        d="M7 22 C 17 18, 29 22, 32 24 C 35 22, 47 18, 57 22 L 57 42 C 47 38, 35 42, 32 44 C 29 42, 17 38, 7 42 Z"
        fill="#FFFFFF"
        stroke="#00ADC1"
        strokeWidth="1.5"
      />

      {/* Center Spine Crease Line */}
      <Path d="M32 24 L32 44" stroke="#00ADC1" strokeWidth="1.5" />

      {/* Left Page Horizontal Lines */}
      <Path d="M13 28 H 27" stroke="#00ADC1" strokeWidth="2" strokeLinecap="round" />
      <Path d="M13 31.5 H 27" stroke="#00ADC1" strokeWidth="2" strokeLinecap="round" />
      <Path d="M13 35 H 27" stroke="#00ADC1" strokeWidth="2" strokeLinecap="round" />
      <Path d="M13 38.5 H 27" stroke="#00ADC1" strokeWidth="2" strokeLinecap="round" />

      {/* Right Page Horizontal Lines */}
      <Path d="M37 28 H 51" stroke="#00ADC1" strokeWidth="2" strokeLinecap="round" />
      <Path d="M37 31.5 H 51" stroke="#00ADC1" strokeWidth="2" strokeLinecap="round" />
      <Path d="M37 35 H 51" stroke="#00ADC1" strokeWidth="2" strokeLinecap="round" />
      <Path d="M37 38.5 H 51" stroke="#00ADC1" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );

  const renderReadingCard = ({ title, text, badgeIcon, scholarName, scholarWork, customContent, scrollEnabled = false, currentPage = 1, totalPages = 1 }) => (
    <View style={styles.tabContentContainer}>
      <View style={[styles.modernCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#F0F4F8' }]}>

        {/* Top Badges Row */}
        <View style={styles.cardBadgesRow}>
          <View style={[styles.badgeCircle, { backgroundColor: isDark ? '#0F172A' : '#F0F9FA', flexShrink: 0 }]}>
            <Ionicons name={badgeIcon} size={rs(20)} color="#16858A" />
          </View>
          <Text style={[styles.cardHeaderTitleText, { color: isDark ? '#E8EDF2' : '#14363F', marginLeft: rs(14) }]}>
            {title}
          </Text>
        </View>

        {/* Custom Divider */}
        <View style={styles.customDividerWrap}>
          <View style={[styles.dividerDot, { backgroundColor: isDark ? '#4CD5E8' : '#A4D0CB' }]} />
          <View style={[styles.dividerDot, { backgroundColor: '#16858A', marginLeft: rs(4) }]} />
          <View style={[styles.customDividerLine, { backgroundColor: isDark ? '#334155' : '#D1E8E6', marginLeft: rs(6), marginRight: rs(12) }]} />

          <View style={{
            backgroundColor: isDark ? 'rgba(0,173,193,0.1)' : '#F0FAFB',
            borderColor: '#B2E8EE',
            borderWidth: 1,
            borderRadius: rs(10),
            paddingHorizontal: rs(10),
            paddingVertical: hs(2),
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ fontFamily: FONTS.bold, fontSize: rs(11), color: '#00ADC1' }}>
              {currentPage} / {totalPages}
            </Text>
          </View>

          <View style={[styles.customDividerLine, { backgroundColor: isDark ? '#334155' : '#D1E8E6', marginLeft: rs(12), marginRight: rs(6) }]} />
          <View style={[styles.dividerDot, { backgroundColor: '#16858A', marginRight: rs(4) }]} />
          <View style={[styles.dividerDot, { backgroundColor: isDark ? '#4CD5E8' : '#A4D0CB' }]} />
        </View>

        {/* Main Text with Proper Fade Animation */}
        <View
          style={styles.textScrollView}
        >
          <FadeContent contentKey={text || (customContent ? 'custom' : '')}>
            {customContent ? customContent : (
              <>
                <Text style={[styles.readingText, { color: isDark ? '#E8EDF2' : '#14363F' }]}>{text}</Text>
                {!!scholarName && <Text style={[styles.scholarName, { color: t.text, marginTop: hs(16) }]}>{scholarName}</Text>}
                {!!scholarWork && <Text style={[styles.scholarWork, { color: '#00ADC1' }]}>{scholarWork}</Text>}
              </>
            )}
          </FadeContent>
        </View>

        {/* Bottom Graphic Overlay */}
        <View style={styles.bottomGraphicWrap}>
          <Svg width="100%" height={hs(80)} viewBox="0 0 300 80" preserveAspectRatio="none">
            <Path d="M0 50 Q 75 80 150 50 T 300 50 L 300 80 L 0 80 Z" fill={isDark ? 'rgba(0,173,193,0.05)' : '#F2FAF9'} />
          </Svg>
          {/* Scattered Dots */}
          <View style={[styles.scatterDot, { backgroundColor: '#FF9A92', left: '12%', top: '30%' }]} />
          <View style={[styles.scatterDot, { backgroundColor: '#6DC5C9', left: '38%', top: '70%' }]} />
          <View style={[styles.scatterDot, { backgroundColor: '#F9CF6E', left: '62%', top: '55%' }]} />
          <View style={[styles.scatterDot, { backgroundColor: '#FF9A92', left: '88%', top: '35%' }]} />
          <View style={[styles.scatterDot, { backgroundColor: '#92D7B4', left: '85%', top: '80%' }]} />
        </View>

      </View>
    </View>
  );

  const renderIntroCard = ({ title, iconName, subtitle, insightsCount = 0 }) => {
    const sectionNum = safeStepIndex + 1;
    const totalSections = steps.length;

    return (
      <View style={styles.tabContentContainer}>
        <View style={[styles.introCard2, {
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F4F8',
          backgroundColor: isDark ? '#162331' : '#FFFFFF',
        }]}>
          {/* Section badge row with flanking ornaments - ALWAYS FIXED ON TOP */}
          <View style={[styles.sectionBadgeRow, { paddingTop: hs(16) }]}>
            <View style={[styles.badgeLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#A4D0CB' }]} />
            <Text style={[styles.badgeStar, { color: isDark ? 'rgba(0,173,193,0.4)' : '#16858A' }]}>✦</Text>
            <View style={[styles.badgeLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#A4D0CB' }]} />

            <Text style={[styles.sectionBadgeText, { color: isDark ? '#4CD5E8' : '#16858A', fontWeight: '800', marginHorizontal: rs(10) }]}>SECTION {sectionNum} OF {totalSections}</Text>

            <View style={[styles.badgeLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#A4D0CB' }]} />
            <Text style={[styles.badgeStar, { color: isDark ? 'rgba(0,173,193,0.4)' : '#16858A' }]}>✦</Text>
            <View style={[styles.badgeLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#A4D0CB' }]} />
          </View>

          {/* Centered Cover Content */}
          <View style={{ flex: 1, width: '100%', justifyContent: 'center', paddingBottom: hs(24) }}>
            {/* Icon area with SVG Progress Ring */}
            <View style={styles.introIconArea}>
              <View style={styles.svgRingWrapper}>
                <Animated.View style={{ transform: [{ rotate: spinRotation }] }}>
                  <Svg width={rs(134)} height={rs(134)} viewBox="0 0 134 134">
                    {/* Background thin circle */}
                    <SvgCircle
                      cx="67"
                      cy="67"
                      r="65"
                      stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 173, 193, 0.12)'}
                      strokeWidth="1.2"
                      fill="transparent"
                    />
                    {/* Progress arc */}
                    <SvgCircle
                      cx="67"
                      cy="67"
                      r="65"
                      stroke="#00ADC1"
                      strokeWidth="1.5"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 65}`}
                      strokeDashoffset={`${2 * Math.PI * 65 * (1 - ringProgress)}`}
                      strokeLinecap="round"
                      transform="rotate(-90 67 67)"
                    />
                    {/* Progress Dot */}
                    <SvgCircle
                      cx={`${67 + 65 * Math.cos(ringProgress * 2 * Math.PI - Math.PI / 2)}`}
                      cy={`${67 + 65 * Math.sin(ringProgress * 2 * Math.PI - Math.PI / 2)}`}
                      r="3.5"
                      fill="#00ADC1"
                    />
                  </Svg>
                </Animated.View>

                {/* Central Circle */}
                <View style={[styles.introIconCircle, {
                  backgroundColor: isDark ? '#1E2D3D' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F8FA',
                  shadowColor: isDark ? '#000000' : '#00ADC1',
                }]}>
                  <Ionicons name={iconName} size={rs(32)} color="#00ADC1" />
                </View>
              </View>
            </View>

            {/* Title & Subtitle */}
            <FadeContent contentKey={title}>
              <Text style={[styles.introTitleText2, { color: isDark ? '#E8EDF2' : '#0A1128', marginBottom: hs(16) }]}>{title}</Text>
            </FadeContent>

            {/* Info pills */}
            <View style={styles.introInfoRow}>
              {insightsCount > 0 && (
                <View style={[styles.introInfoPill, { backgroundColor: isDark ? 'rgba(0,173,193,0.1)' : '#F0FAFB', borderColor: isDark ? '#00ADC1' : '#16858A' }]}>
                  <Ionicons name="document-text-outline" size={rs(14)} color={isDark ? '#4CD5E8' : '#16858A'} style={{ marginRight: rs(6) }} />
                  <Text style={[styles.introInfoText, { color: isDark ? '#C5F2F7' : '#14363F', fontWeight: '700' }]}>{insightsCount} Insights</Text>
                </View>
              )}
            </View>

            {/* Start reading indicator */}
            <TouchableOpacity
              style={{ marginTop: hs(24), alignItems: 'center' }}
              activeOpacity={0.8}
              onPress={handleNext}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#00ADC1', paddingHorizontal: rs(20), paddingVertical: hs(10), borderRadius: rs(20) }}>
                <Text style={{ color: '#FFFFFF', fontSize: rs(14), fontWeight: '700', marginRight: rs(8) }}>Start Reading</Text>
                <Ionicons name="arrow-forward" size={rs(16)} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    );
  };

  const renderMeaning = () => {
    if (meaningSubStep === -1) {
      const sentences = getMeaningSentences(name);
      const meaningText = sentences.join(' ');
      const wordCount = countWords(meaningText);
      const readTimeSec = Math.max(15, Math.round((wordCount / 180) * 60));
      return renderIntroCard({
        title: 'Simple Meaning',
        iconName: 'book-outline',
        subtitle: `Understand the essence of ${name.transliteration || name.tr || name.name}\n\n"${name.meaning || name.en || ''}"`,
        insightsCount: sentences.length,
        readTimeSec,
      });
    }
    const sentences = getMeaningSentences(name);
    const currentSentence = sentences[meaningSubStep] || '';
    return renderReadingCard({ title: 'Simple Meaning', text: currentSentence, badgeIcon: 'book-outline', currentPage: meaningSubStep + 1, totalPages: sentences.length });
  };

  const renderReference = (refDataArray, type) => {
    const isQuran = type === 'quran';
    const title = isQuran ? "Pearls from the Qur'an" : "Pearls from the Hadith";

    const sents = getReferenceSentences(refDataArray);

    if (refSubStep === -1) {
      const refText = sents.map(s => s.text).join(' ');
      const wordCount = countWords(refText);
      const readTimeSec = Math.max(20, Math.round((wordCount / 180) * 60));
      return renderIntroCard({
        title,
        iconName: 'library-outline',
        subtitle: isQuran
          ? `Explore Holy Qur'an verses referencing ${name.transliteration || name.name}`
          : `Explore Prophetic traditions referencing ${name.transliteration || name.name}`,
        insightsCount: sents.length,
        readTimeSec,
      });
    }

    const currentSent = sents[refSubStep];
    if (!currentSent) return null;

    const refData = currentSent.refData;

    if (currentSent.type === 'string') {
      return renderReadingCard({ title, text: currentSent.text, badgeIcon: 'library-outline', currentPage: refSubStep + 1, totalPages: sents.length });
    }

    const customContent = (
      <View style={{ width: '100%' }}>
        {!!refData.reference && (
          <View style={styles.refBadgeRow}>
            <View style={[styles.refBadgePill, { backgroundColor: isDark ? '#0F2A30' : '#E8F9FB', borderColor: isDark ? '#1E4A55' : '#A0E4EC' }]}>
              <Ionicons name="book-outline" size={rs(13)} color="#00ADC1" style={{ marginRight: rs(6) }} />
              <Text style={[styles.refBadgeText, { color: isDark ? '#9EAAB8' : '#1A4A55' }]}>{refData.reference}</Text>
            </View>
          </View>
        )}

        <Text style={[styles.refSectionLabel, { color: isDark ? '#4CD5E8' : '#16858A' }]}>
          {currentSent.type === 'simpleMeaning' ? 'Simple explanation' : (isQuran ? 'Why this verse:' : 'Why this Hadith:')}
        </Text>

        <Text style={[styles.readingText, { color: t.text, marginBottom: hs(20) }]}>{currentSent.text}</Text>

        {!!refData.arabic && (
          <>
            <TouchableOpacity
              style={[styles.seeArabicBtn, { borderColor: isDark ? 'rgba(0,173,193,0.30)' : 'rgba(0,173,193,0.25)', backgroundColor: isDark ? '#0F2A30' : '#F0FCFD' }]}
              onPress={() => {
                setShowArabicVerse(prev => {
                  const nxt = !prev;
                  if (!nxt) {
                    setTimeout(() => readingCardScrollRef.current?.scrollTo({ y: 0, animated: true }), 150);
                  }
                  return nxt;
                });
              }}
              activeOpacity={0.75}
            >
              <Ionicons name={showArabicVerse ? 'eye-off-outline' : 'eye-outline'} size={rs(16)} color="#00ADC1" style={{ marginRight: rs(8) }} />
              <Text style={styles.seeArabicBtnText}>{showArabicVerse ? 'Hide Arabic Verse' : 'See Arabic Verse'}</Text>
            </TouchableOpacity>

            {showArabicVerse && (
              <View style={[styles.arabicVerseBox, { backgroundColor: isDark ? '#0D1F29' : '#F8FDFE', borderColor: isDark ? 'rgba(0,173,193,0.20)' : '#C8F0F5' }]}>
                <Text style={[styles.modernArabicText, { color: t.text }]}>{refData.arabic}</Text>
              </View>
            )}
          </>
        )}
      </View>
    );

    return renderReadingCard({ title, customContent, badgeIcon: 'library-outline', scrollEnabled: showArabicVerse, currentPage: refSubStep + 1, totalPages: sents.length });
  };

  const renderGifts = () => {
    const sents = flattenToSentences(name.gifts);
    if (giftSubStep === -1) {
      const wordCount = countWords(sents.join(' '));
      const readTimeSec = Math.max(15, Math.round((wordCount / 180) * 60));
      return renderIntroCard({
        title: 'The Gift of This Name',
        iconName: 'gift-outline',
        subtitle: `Discover the spiritual gifts and blessings connected to ${name.transliteration || name.name}`,
        insightsCount: sents.length,
        readTimeSec,
      });
    }
    const currentGift = sents[giftSubStep] || '';
    return renderReadingCard({ title: 'The Gift of This Name', text: currentGift, badgeIcon: 'gift-outline', currentPage: giftSubStep + 1, totalPages: sents.length });
  };

  const renderPractical = () => {
    const sents = flattenToSentences(name.practicalWays);
    if (practicalSubStep === -1) {
      const wordCount = countWords(sents.join(' '));
      const readTimeSec = Math.max(15, Math.round((wordCount / 180) * 60));
      return renderIntroCard({
        title: 'How To Live With This Name',
        iconName: 'compass-outline',
        subtitle: `Actionable ways to embody and live by ${name.transliteration || name.name}`,
        insightsCount: sents.length,
        readTimeSec,
      });
    }
    const way = sents[practicalSubStep] || '';
    return renderReadingCard({ title: 'How To Live With This Name', text: way, badgeIcon: 'compass-outline', currentPage: practicalSubStep + 1, totalPages: sents.length });
  };

  const renderScholarly = () => {
    const sents = flattenToSentences(name.scholarlyViews);
    if (scholarSubStep === -1) {
      const wordCount = countWords(sents.join(' '));
      const readTimeSec = Math.max(15, Math.round((wordCount / 180) * 60));
      return renderIntroCard({
        title: 'Scholarly View',
        iconName: 'school-outline',
        subtitle: `Classical scholarly wisdom and commentary on ${name.transliteration || name.name}`,
        insightsCount: sents.length,
        readTimeSec,
      });
    }
    const viewText = sents[scholarSubStep] || '';
    if (!viewText) return null;
    return renderReadingCard({ title: 'Scholarly View', text: `"${viewText}"`, badgeIcon: 'school-outline', currentPage: scholarSubStep + 1, totalPages: sents.length });
  };

  const renderReflection = () => {
    const cardAnswers = getReflectionAnswers(name);

    const questions = [
      { key: 'q1', label: 'How To Live With the Names of Allah', value: reflection1, setter: setReflection1 },
    ];

    return (
      <View style={[styles.tabContentContainer, { flex: 1 }]}>
        {questions.map((q) => (
          <View key={q.key} style={{ flex: 1 }}>
            <View style={[styles.reflectionCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder, flex: 1 }]}>
              <View style={styles.reflectionCardHeader}>
                <Text style={[styles.reflectionQuestion, { color: t.text }]}>{q.label}</Text>
              </View>

              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                style={{ flex: 1, marginTop: hs(8) }}
                contentContainerStyle={{ gap: hs(12), paddingBottom: hs(8) }}
              >
                {cardAnswers.map((ans, idx) => {
                  const isSelected = reflection1 === ans;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.reflectionOptionRow,
                        {
                          backgroundColor: isSelected ? (isDark ? 'rgba(76, 175, 80, 0.10)' : '#F0FBF2') : (isDark ? '#142030' : '#FAFAFA'),
                          borderColor: isSelected ? '#4CAF50' : (isDark ? 'rgba(255,255,255,0.08)' : '#ECECEC'),
                        }
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setReflection1(ans)}
                    >
                      <View style={[
                        styles.reflectionRadioCircle,
                        { borderColor: isSelected ? '#4CAF50' : (isDark ? '#6B7A8D' : '#B0BEC5') }
                      ]}>
                        {isSelected && <View style={styles.reflectionGreenDot} />}
                      </View>
                      <Text style={[styles.reflectionOptionText, { color: t.text }]}>{ans}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderMastery = () => {
    let mcq = name.mcq && name.mcq.length > 0 ? name.mcq[0] : null;
    if (!mcq) {
      mcq = {
        q: `What does ${name.tr} mean?`,
        opts: [name.en, 'The Most Merciful', 'The Provider', 'The Judge'],
        ans: 0
      };
    }

    return (
      <View style={styles.tabContentContainer}>
        <Text style={[styles.quizQuestion, { color: t.text }]}>{mcq.q}</Text>

        <View style={styles.quizOptions}>
          {mcq.opts.map((opt, idx) => {
            const isSelected = masteryAnswer === idx;
            const isCorrect = idx === mcq.ans;
            const showStatus = masteryDone;

            let borderColor = 'transparent';
            let bgColor = t.optionBg;
            let iconColor = '#00ADC1';

            if (showStatus) {
              if (isSelected && isCorrect) {
                borderColor = '#4CAF50';
              } else if (isSelected && !isCorrect) {
                borderColor = '#F44336';
              } else if (isCorrect) {
                borderColor = '#4CAF50';
              } else {
                iconColor = '#ccc';
              }
            } else if (isSelected) {
              borderColor = '#00ADC1';
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.quizOptionRow, { borderColor, backgroundColor: bgColor, borderWidth: (showStatus && (isSelected || isCorrect)) || isSelected ? 1 : 0 }]}
                onPress={() => {
                  if (masteryDone) return;
                  setMasteryAnswer(idx);
                  setMasteryDone(true);
                }}
                disabled={masteryDone}
              >
                <View style={[styles.quizRadio, { borderColor: iconColor }]}>
                  {(showStatus ? (isSelected || isCorrect) : isSelected) && (
                    <View style={[styles.quizRadioInner, { backgroundColor: iconColor }]} />
                  )}
                </View>
                <Text style={[styles.quizOptionText, { color: t.text }]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {masteryDone && (
          <View style={{ marginTop: hs(24), width: '100%', gap: hs(12) }}>
            {masteryAnswer !== mcq.ans && (
              <View style={[styles.statusBanner, { borderColor: '#F44336', backgroundColor: t.statusBg }]}>
                <View style={[styles.statusIconWrap, { backgroundColor: '#F44336' }]}>
                  <Ionicons name="close" size={rs(16)} color="#FFF" />
                </View>
                <Text style={[styles.statusText, { color: '#F44336' }]}>Wrong Answer</Text>
              </View>
            )}
            <View style={[styles.statusBanner, { borderColor: '#4CAF50', backgroundColor: t.statusBg }]}>
              <View style={[styles.statusIconWrap, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="checkmark" size={rs(16)} color="#FFF" />
              </View>
              <Text style={[styles.statusText, { color: '#4CAF50' }]}>Correct Answer</Text>
            </View>
            {masteryAnswer !== mcq.ans && (
              <TouchableOpacity
                style={styles.tryAgainBtn}
                onPress={() => { setMasteryAnswer(null); setMasteryDone(false); }}
              >
                <Text style={styles.tryAgainText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this beautiful Name of Allah: ${name.transliteration} (${name.arabic}) - ${name.meaning}.\n\nLearn more on the Wahid App!`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  // ── Render ──

  if (phase === 'journey') {
    const MASTERY_THRESHOLD = 3;
    const completedReads = revisits + 1; // this session just counted
    const displayReads = Math.min(MASTERY_THRESHOLD, completedReads);
    const remaining = Math.max(0, MASTERY_THRESHOLD - completedReads);

    const journeyNote = isMastered
      ? 'You are the master of this journey!'
      : remaining === 1
        ? `Read this name 1 more time to unlock Mastered.`
        : `Read this name ${remaining} more times to unlock Mastered.`;

    return (
      <View style={styles.root}>
        <TimeBasedBackground showElements={false}>
          {({ isNight }) => (
            <>
              <StatusBar barStyle={isNight ? "light-content" : "dark-content"} />
              <SafeAreaView style={[styles.journeyRootNew, { backgroundColor: isDark ? '#0F172A' : '#F6F8FC' }]} edges={['top']}>
                <TouchableOpacity
                  activeOpacity={1}
                  style={{ flex: 1, width: '100%', justifyContent: 'space-between', alignItems: 'center' }}
                  onPress={() => navigation.goBack()}
                >
                  <Animated.View style={[
                    styles.journeyCardNew,
                    {
                      opacity: journeyOpacity,
                      transform: [{ translateY: journeyTranslate }],
                      backgroundColor: isDark ? '#0F172A' : '#F6F8FC'
                    }
                  ]}>
                    {/* Top drag handle indicator */}
                    <View style={styles.dragHandle} />

                    {/* Title & Subtitle */}
                    <Text style={styles.journeyNewTitle}>
                      <Text style={{ color: isDark ? '#E8EDF2' : '#1E293B', fontWeight: '800' }}>Your </Text>
                      <Text style={{ color: '#00ADC1', fontWeight: '800' }}>Journey</Text>
                    </Text>
                    <Text style={[styles.journeyNewSub, { color: isDark ? '#9EAAB8' : '#64748B' }]}>Track your mastery</Text>

                    {/* Main Progress Card */}
                    <View style={[styles.journeyMainBox, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F0F4F8' }]}>
                      {/* Learned Circle */}
                      <View style={{ alignItems: 'center' }}>
                        <View style={[styles.journeyCircleIcon, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9' }]}>
                          <Ionicons name="school" size={rs(28)} color="#4CAF50" />
                        </View>
                        <Text style={[styles.journeyCircleLabel, { color: isDark ? '#E8EDF2' : '#1E293B' }]}>Learned</Text>
                      </View>

                      {/* Progress Line */}
                      <View style={styles.journeyLineContainer}>
                        <View style={[styles.journeyLineBackground, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                          <View style={[styles.journeyLineFill, { width: `${Math.min(1, completedReads / MASTERY_THRESHOLD) * 100}%` }]} />
                        </View>
                        <View style={[
                          styles.journeyLineDot,
                          { left: `${Math.min(1, completedReads / MASTERY_THRESHOLD) * 100}%` }
                        ]} />
                      </View>

                      {/* Mastered Section */}
                      <View style={{ alignItems: 'center' }}>
                        {(completedReads >= MASTERY_THRESHOLD || isMastered) ? (
                          /* After 3 reads: Circular Mastered Icon */
                          <View style={[
                            styles.journeyCircleIcon,
                            { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFF8E1' }
                          ]}>
                            <Svg width={rs(28)} height={rs(28)} viewBox="0 0 24 24" fill="none">
                              <Path
                                d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z"
                                fill="#F59E0B"
                                stroke="#F59E0B"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                              />
                              <Path
                                d="M5 18H19V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V18Z"
                                fill="#F59E0B"
                              />
                            </Svg>
                          </View>
                        ) : (
                          /* Before 3 reads: Lock Icon Container */
                          <View style={{ width: rs(60), height: rs(60), justifyContent: 'center', alignItems: 'center' }}>
                            {/* Lock Top Shackle */}
                            <View style={[
                              styles.lockShackle,
                              { borderColor: isDark ? '#4CD5E8' : '#00ADC1' }
                            ]} />
                            {/* Lock Main Body */}
                            <View style={[
                              styles.lockBodyContainer,
                              {
                                backgroundColor: isDark ? 'rgba(0, 173, 193, 0.10)' : '#F0F9FA',
                                borderColor: isDark ? 'rgba(0, 173, 193, 0.35)' : '#A0E4EC'
                              }
                            ]}>
                              <Svg width={rs(22)} height={rs(22)} viewBox="0 0 24 24" fill="none">
                                <Path
                                  d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z"
                                  fill={isDark ? '#4CD5E8' : '#00ADC1'}
                                  stroke={isDark ? '#4CD5E8' : '#00ADC1'}
                                  strokeWidth="1.5"
                                  strokeLinejoin="round"
                                />
                                <Path
                                  d="M5 18H19V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V18Z"
                                  fill={isDark ? '#4CD5E8' : '#00ADC1'}
                                />
                              </Svg>
                            </View>
                          </View>
                        )}
                        <Text style={[
                          styles.journeyCircleLabel,
                          {
                            color: (completedReads >= MASTERY_THRESHOLD || isMastered)
                              ? "#F59E0B"
                              : (isDark ? '#E8EDF2' : '#1E293B')
                          }
                        ]}>Mastered</Text>
                      </View>
                    </View>

                    {/* Read Progress Dots */}
                    <View style={styles.journeyDotsContainer}>
                      <View style={{ flexDirection: 'row', gap: rs(8), marginBottom: hs(6) }}>
                        {Array.from({ length: MASTERY_THRESHOLD }).map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.journeyDotNew,
                              i < displayReads ? { backgroundColor: '#00ADC1' } : { backgroundColor: isDark ? '#334155' : '#E2E8F0' },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={styles.journeyReadsText}>{displayReads}/{MASTERY_THRESHOLD} reads</Text>
                      <Text style={[styles.journeyNoteText, { color: isDark ? '#9EAAB8' : '#64748B' }]}>{journeyNote}</Text>
                    </View>

                    {/* Central Encouragement Badge */}
                    <View style={styles.badgeIllustrationContainer}>
                      <View style={[styles.outerGlowCircle, { backgroundColor: isDark ? 'rgba(0, 173, 193, 0.08)' : '#E6F7F9' }]}>
                        <View style={[styles.innerGlowCircle, { backgroundColor: isDark ? 'rgba(0, 173, 193, 0.15)' : '#CEF0F4' }]}>
                          <View style={styles.whiteCoreCircle}>
                            <BadgeOpenBookIcon size={rs(46)} />
                          </View>
                        </View>
                      </View>

                      <Text style={styles.keepGoingTitle}>Keep going!</Text>
                      <Text style={[styles.keepGoingSub, { color: isDark ? '#9EAAB8' : '#64748B' }]}>You're doing great.</Text>
                    </View>

                    {/* Done Button */}
                    <TouchableOpacity
                      style={styles.doneBtnNew}
                      onPress={() => navigation.goBack()}
                      activeOpacity={0.85}
                    >
                      <LinearGradient colors={['#00ADC1', '#0090A8']} style={styles.doneBtnGradNew}>
                        <Text style={styles.doneBtnTextNew}>Done</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Bottom Wave Graphic */}
                  <View style={styles.bottomWaveContainer} pointerEvents="none">
                    <Svg width="100%" height={hs(95)} viewBox="0 0 375 90" preserveAspectRatio="none">
                      <Path
                        d="M0 40 C 100 75, 220 10, 375 30 L 375 90 L 0 90 Z"
                        fill="#00ADC1"
                        opacity={0.35}
                      />
                      <Path
                        d="M0 55 C 130 25, 250 80, 375 40 L 375 90 L 0 90 Z"
                        fill="#00ADC1"
                      />
                    </Svg>
                  </View>
                </TouchableOpacity>
              </SafeAreaView>
            </>
          )}
        </TimeBasedBackground>
      </View>
    );
  }

  const handX = handAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });


  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: exitAnim }] }]}>
      <TimeBasedBackground showElements={false}>
        {({ isNight }) => (
          <View style={{ flex: 1, backgroundColor: (currentStep.type === 'reflection' || !isChromeVisible) ? '#000000' : (isDark ? '#0F172A' : '#FFFFFF') }}>
            <StatusBar barStyle={(currentStep.type === 'reflection' || !isChromeVisible) ? "light-content" : (isNight ? "light-content" : "dark-content")} />
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                {
                  zIndex: 2,
                  backgroundColor: '#000000',
                  opacity: chromeOpacity.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                },
              ]}
            />
            <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'left', 'right']}>
              <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'transparent' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
                <View style={{ flex: 1, backgroundColor: 'transparent' }}>

                  <Animated.View
                    style={{
                      opacity: chromeOpacity.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
                      zIndex: 10,
                    }}
                    pointerEvents="auto"
                  >
                    <NameDetailHeader
                      name={name}
                      steps={steps}
                      currentStepIndex={safeStepIndex}
                      isFavorite={isFavorite}
                      isFocusMode={!isChromeVisible}
                      onFavoritePress={() => toggleFavourite(name.number || name.id)}
                      onSharePress={() => Share.share({ message: `Learn about the name ${name.transliteration} - ${name.meaning}` })}
                      onSettingsPress={() => setReadingSettingsVisible(true)}
                    />
                  </Animated.View>

                  {/* ── Fixed Main Title ── */}
                  {(() => {
                    let stepTitle = null;
                    if (currentStep.type === 'gifts') stepTitle = '';
                    else if (currentStep.type === 'practical') stepTitle = '';
                    else if (currentStep.type === 'scholarly') stepTitle = 'Scholarly Views';
                    else if (currentStep.type === 'reflection') stepTitle = 'Reflection';
                    else if (currentStep.type === 'mastery') stepTitle = 'Mastery Test';

                    if (!stepTitle) return null;
                    return (
                      <Animated.View style={{ opacity: contentOpacity, paddingHorizontal: rs(20), marginBottom: hs(12), zIndex: 10 }}>
                        <Text style={[styles.mainTitle, { marginBottom: 0, color: t.text }]}>{stepTitle}</Text>
                      </Animated.View>
                    );
                  })()}

                  <View style={{ flex: 1, paddingHorizontal: rs(16), paddingTop: hs(4), paddingBottom: hs(8), zIndex: 60 }}>
                    {/* Outer card with border animates scale, translation, rotation, and opacity synchronously */}
                    <Animated.View
                      style={[
                        styles.focusGlow,
                        currentStep.type === 'reflection' && { backgroundColor: '#00ADC1', borderRadius: rs(20), padding: rs(3) },
                        {
                          opacity: contentOpacity,
                          transform: [
                            { scale: chromeOpacity.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
                            { translateY: contentTranslateY },
                            { rotateY: flipAnim.interpolate({ inputRange: [-90, 0, 90], outputRange: ['-90deg', '0deg', '90deg'] }) },
                          ],
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        {currentStep.type === 'meaning' && renderMeaning()}
                        {(currentStep.type === 'quran' || currentStep.type === 'hadith') && renderReference(currentStep.data, currentStep.type)}
                        {currentStep.type === 'gifts' && renderGifts()}
                        {currentStep.type === 'practical' && renderPractical()}
                        {currentStep.type === 'scholarly' && renderScholarly()}
                        {currentStep.type === 'reflection' && renderReflection()}
                        {currentStep.type === 'mastery' && renderMastery()}
                      </View>
                    </Animated.View>
                  </View>

                  {/* ── Bottom Navigation ── */}
                  <View style={[
                    styles.bottomNavWrapper,
                    {
                      zIndex: 10,
                      backgroundColor: currentStep.type === 'reflection' ? '#000000' : 'transparent',
                      paddingBottom: Math.max((insets.bottom || 0) + hs(10), Platform.OS === 'android' ? hs(30) : hs(20)),
                    }
                  ]}>
                    <View style={[styles.bottomNavInner, {
                      backgroundColor: (currentStep.type === 'reflection' || !isChromeVisible) ? '#000000' : (isDark ? '#1E293B' : '#FFFFFF'),
                      borderColor: (currentStep.type === 'reflection' || !isChromeVisible) ? '#000000' : (isDark ? 'rgba(255,255,255,0.08)' : '#DCEFF2'),
                      borderWidth: (currentStep.type === 'reflection' || !isChromeVisible) ? 0 : 1,
                      shadowOpacity: (currentStep.type === 'reflection' || !isChromeVisible) ? 0 : 0.05,
                      elevation: (currentStep.type === 'reflection' || !isChromeVisible) ? 0 : 2,
                      shadowColor: '#000000',
                    }]}>
                      {/* Previous */}
                      <TouchableOpacity
                        style={[styles.squircleNavBtn, { opacity: isBackDisabled ? 0.4 : 1 }]}
                        disabled={isBackDisabled}
                        onPress={goPrev}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="arrow-back" size={rs(20)} color="#FFFFFF" />
                      </TouchableOpacity>

                      {/* Continue */}
                      <TouchableOpacity
                        style={[styles.squircleNavBtn, { opacity: isSlideDisabled ? 0.4 : 1 }]}
                        disabled={isSlideDisabled}
                        onPress={handleNext}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="arrow-forward" size={rs(20)} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </SafeAreaView>

          </View>
        )}
      </TimeBasedBackground>

      <ReadingSettingsModal
        visible={readingSettingsVisible}
        onClose={() => setReadingSettingsVisible(false)}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: SH, backgroundColor: 'transparent', overflow: 'hidden' },

  // ── Navigation ──
  navSection: { marginTop: hs(16), marginBottom: hs(24), alignItems: 'center' },
  progressWrap: { width: '85%', marginBottom: hs(24) },
  progressTrack: { height: hs(14), backgroundColor: '#FFFFFF', borderRadius: rs(20), width: '100%', shadowColor: '#00ADC1', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  progressFill: { height: '100%', backgroundColor: '#00ADC1', borderRadius: rs(20) },
  navRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' },
  categoryPill: { paddingHorizontal: rs(40), paddingVertical: hs(4), justifyContent: 'center', alignItems: 'center' },
  categoryPillText: { fontSize: rs(14), fontWeight: '900', color: '#1A1A1A' },

  // ── Content ──
  scrollArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: rs(16), paddingTop: hs(6), paddingBottom: hs(40) },
  focusGlow: {
    flex: 1,
    borderRadius: rs(20),
    borderWidth: 1.5,
    borderColor: 'rgba(77,220,235,0.65)',
    overflow: 'hidden',
  },
  tabContentContainer: { width: '100%', flex: 1 },
  mainTitle: { fontSize: rs(20), fontWeight: '800', color: '#1A1A1A', marginBottom: hs(24) },
  sectionTitle: { fontSize: rs(18), fontWeight: '800', color: '#1A1A1A', marginBottom: hs(12) },

  // ── Modern Cards (Glassmorphic / Minimal) ──
  modernCard: { flex: 1, width: '100%', backgroundColor: '#FFFFFF', borderRadius: rs(20), borderWidth: 1, borderColor: '#F0F4F8', overflow: 'hidden', paddingBottom: 0 },
  cardBadgesRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(24), paddingTop: hs(16), zIndex: 2 },
  badgeCircle: { width: rs(44), height: rs(44), borderRadius: rs(22), justifyContent: 'center', alignItems: 'center', marginRight: rs(12) },
  cardHeaderTitleText: { fontSize: rs(18), fontWeight: '700', flexShrink: 1, fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif' },
  customDividerWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(24), marginVertical: hs(12), zIndex: 2 },
  customDividerLine: { flex: 1, height: 1.5 },
  dividerDot: { width: rs(4), height: rs(4), borderRadius: rs(2) },
  textContentWrap: { flex: 1, paddingHorizontal: rs(30), paddingTop: hs(10), paddingBottom: hs(30), alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  textScrollView: { flex: 1, width: '100%', zIndex: 2, paddingHorizontal: rs(24), paddingBottom: hs(30), justifyContent: 'center' },
  textScrollContent: { flexGrow: 1, paddingHorizontal: rs(40), paddingTop: hs(10), paddingBottom: hs(40), alignItems: 'center', justifyContent: 'center' },
  readingText: { fontSize: rs(18.5), fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', fontWeight: '500', textAlign: 'center', lineHeight: rs(28) },
  bottomGraphicWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, height: hs(80), zIndex: 1, borderBottomLeftRadius: rs(20), borderBottomRightRadius: rs(20), overflow: 'hidden' },
  scatterDot: { position: 'absolute', width: rs(4.5), height: rs(4.5), borderRadius: rs(2.5) },

  // ── Intro Cards (Section Covers) ──
  introCard2: {
    flex: 1,
    width: '100%', borderRadius: rs(20),
    borderWidth: 1, overflow: 'hidden',
    paddingBottom: 0,
  },
  sectionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: hs(12),
    marginBottom: hs(8),
    width: '100%',
    paddingHorizontal: rs(20),
  },
  badgeLine: {
    flex: 1,
    height: 1,
    maxWidth: rs(40),
  },
  badgeStar: {
    fontSize: rs(10),
    marginHorizontal: rs(8),
  },
  sectionBadge: {
    borderRadius: rs(20),
    paddingHorizontal: rs(16),
    paddingVertical: hs(6),
  },
  sectionBadgeText: { fontSize: rs(11), fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  introIconArea: {
    alignSelf: 'center',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: hs(6),
  },
  svgRingWrapper: {
    width: rs(134),
    height: rs(134),
    justifyContent: 'center',
    alignItems: 'center',
  },
  introIconCircle: {
    position: 'absolute',
    width: rs(94), height: rs(94), borderRadius: rs(47),
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  introTitleText2: {
    fontSize: rs(23), fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', fontWeight: 'bold',
    textAlign: 'center', paddingHorizontal: rs(20),
    letterSpacing: 0.5,
  },
  introOrnamentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginVertical: hs(10),
  },
  introOrnamentLine: { width: rs(80), height: 1 },
  introOrnamentStar: { fontSize: rs(14), color: '#00ADC1', marginHorizontal: rs(12) },
  introSubtitleText2: {
    fontSize: rs(13.5), fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', fontWeight: '400',
    textAlign: 'center', paddingHorizontal: rs(30),
  },
  introInfoRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: rs(12), marginTop: hs(10),
    paddingHorizontal: rs(20),
  },
  introInfoPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(16), paddingVertical: hs(6),
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: 'rgba(0,173,193,0.15)',
  },
  introInfoText: { fontSize: rs(13), fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', fontWeight: '600', color: '#0090A8' },

  // ── Bottom Navigation ──
  bottomNavWrapper: {
    width: '100%',
    paddingHorizontal: rs(16),
    paddingTop: hs(6),
    paddingBottom: Platform.OS === 'ios' ? hs(24) : hs(16),
  },
  bottomNavInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: rs(14),
    paddingHorizontal: rs(10),
    height: hs(56),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  squircleNavBtn: {
    width: rs(34), height: rs(34),
    borderRadius: rs(10),
    backgroundColor: '#3CA2A5',
    borderWidth: rs(2),
    borderColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rs(24),
    paddingHorizontal: rs(20),
    height: rs(46),
  },
  navDivider: {
    width: 1,
    height: rs(20),
    marginHorizontal: rs(12),
  },
  navBtnText: {
    fontSize: rs(14),
    fontWeight: '600',
  },
  navCardTexts: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: rs(8),
  },
  navCardTitle: {
    fontSize: rs(13),
    fontWeight: '800',
  },
  navCardSubtitle: {
    fontSize: rs(9),
    marginTop: hs(1),
  },

  // ── Reference Card ──
  refCard: { backgroundColor: '#FFFFFF', borderTopRightRadius: rs(8), borderBottomRightRadius: rs(8), borderTopLeftRadius: rs(4), borderBottomLeftRadius: rs(4), borderLeftWidth: rs(6), borderLeftColor: '#00ADC1', borderWidth: 1, borderColor: '#00ADC1', padding: rs(16), paddingBottom: hs(40), position: 'relative', overflow: 'hidden' },
  refArabic: { fontSize: rs(22), fontWeight: '700', color: '#1A1A1A', textAlign: 'justify', lineHeight: rs(40), writingDirection: 'rtl', marginBottom: hs(16), zIndex: 2 },
  refLabel: { position: 'absolute', bottom: hs(12), left: rs(16), fontSize: rs(13), color: '#1A1A1A', fontWeight: '800', zIndex: 2 },
  refSplatter: { position: 'absolute', bottom: hs(-10), right: rs(-10), width: rs(80), height: rs(80), opacity: 0.15, zIndex: 1 },
  refSimpleMeaning: { fontSize: rs(14), color: '#3A3A3A', lineHeight: rs(24) },
  refSignificance: { fontSize: rs(14), color: '#3A3A3A', lineHeight: rs(24) },
  refDividerWrap: { alignItems: 'center', marginVertical: hs(20) },
  goldDivider: { width: rs(140), height: hs(12), opacity: 0.9 },
  fadeInBlock: { width: '100%' },
  refBadgeRow: { marginBottom: hs(24), width: '100%', alignItems: 'center' },
  refBadgePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', paddingHorizontal: rs(12), paddingVertical: hs(5), borderRadius: rs(20), borderWidth: 1 },
  refBadgeText: { fontSize: rs(12), fontWeight: '700' },
  refSectionLabel: { fontSize: rs(11), fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: hs(10), color: '#00ADC1', textAlign: 'center', alignSelf: 'center' },
  seeArabicBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', paddingHorizontal: rs(14), paddingVertical: hs(8), borderRadius: rs(20), borderWidth: 1, marginTop: hs(24), marginBottom: hs(12) },
  seeArabicBtnText: { fontSize: rs(13), fontWeight: '700', color: '#00ADC1' },
  arabicVerseBox: { borderRadius: rs(12), borderWidth: 1, padding: rs(16), marginTop: hs(4) },
  modernArabicText: { fontSize: rs(20), fontWeight: '700', fontFamily: FONTS.arabicBold, textAlign: 'right', lineHeight: rs(38), writingDirection: 'rtl' },

  // ── Gifts Card ──
  giftCardContainer: { backgroundColor: '#FFFFFF', borderRadius: rs(8), borderWidth: 1, borderColor: '#F0F4F8', marginBottom: hs(4) },
  giftCardInner: { flexDirection: 'row', borderRadius: rs(8), overflow: 'hidden' },
  giftLeft: { width: rs(90), alignItems: 'center', paddingTop: hs(16), justifyContent: 'space-between' },
  giftLeftLabel: { fontSize: rs(12), color: '#1A1A1A', textAlign: 'center', fontWeight: '800', lineHeight: rs(14), marginBottom: hs(12) },
  giftArch: { width: rs(44), height: hs(48), backgroundColor: '#13BCCF', borderTopLeftRadius: rs(22), borderTopRightRadius: rs(22), justifyContent: 'center', alignItems: 'center' },
  giftNumCircle: { width: rs(30), height: rs(30), borderRadius: rs(15), backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  giftNumText: { color: '#1A1A1A', fontSize: rs(14), fontWeight: '900' },
  giftDivider: { width: 1, backgroundColor: '#00ADC1', opacity: 0.2, marginVertical: hs(16) },
  giftRight: { flex: 1, padding: rs(16), justifyContent: 'center' },
  giftText: { fontSize: rs(13), color: '#1A1A1A', lineHeight: rs(20) },

  // ── Practical Card ──
  practicalCardContainer: { backgroundColor: '#FFFFFF', borderRadius: rs(4), borderWidth: 1, borderColor: '#F0F4F8', marginBottom: hs(4) },
  practicalCardInner: { flexDirection: 'row', borderRadius: rs(4), overflow: 'hidden', borderWidth: 1, borderColor: '#A0E4EC', position: 'relative' },
  practicalLeftCol: { width: rs(64), backgroundColor: '#F0FAFC', borderRightWidth: 1, borderRightColor: '#A0E4EC', justifyContent: 'center', alignItems: 'center', paddingVertical: hs(20) },
  notebookRings: { position: 'absolute', left: rs(64) - rs(12), width: rs(24), height: '100%', justifyContent: 'space-evenly', alignItems: 'center', paddingVertical: hs(12), zIndex: 2 },
  ringWrap: { width: '100%', height: hs(12), position: 'relative', justifyContent: 'center', alignItems: 'center' },
  ringHoleLeft: { position: 'absolute', left: rs(2), width: rs(8), height: rs(8), borderRadius: rs(4), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D0D0' },
  ringHoleRight: { position: 'absolute', right: rs(2), width: rs(8), height: rs(8), borderRadius: rs(4), backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#D0D0D0' },
  ringMetal: { position: 'absolute', width: rs(14), height: hs(4), backgroundColor: '#00ADC1', borderRadius: rs(2) },
  practicalContent: { flex: 1, padding: rs(16), backgroundColor: '#FFFFFF', justifyContent: 'center' },
  practicalTitle: { fontSize: rs(12), fontWeight: '800', color: '#1A1A1A', letterSpacing: 2, marginBottom: hs(12) },
  practicalText: { fontSize: rs(13), color: '#3A3A3A', lineHeight: rs(20) },

  // ── Scholarly Card ──
  scholarCard: { borderRadius: rs(12), padding: rs(24), borderWidth: 1, borderColor: '#F0F4F8', alignItems: 'center' },
  scholarName: { fontSize: rs(20), fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', fontWeight: '800', color: '#1A1A1A', marginBottom: hs(4) },
  scholarWork: { fontSize: rs(13), fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', fontWeight: '700', color: '#1A1A1A', marginBottom: hs(16) },
  scholarQuote: { fontSize: rs(13), color: '#3A3A3A', fontStyle: 'italic', textAlign: 'center', lineHeight: rs(20) },

  // ── Reflection Cards (premium) ──
  reflectionCard: { backgroundColor: '#FFFFFF', borderRadius: rs(16), padding: rs(20), borderWidth: 1, borderColor: 'rgba(0,173,193,0.10)' },
  reflectionCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: hs(16), gap: rs(12) },
  reflectionNumBadge: { width: rs(36), height: rs(36), borderRadius: rs(10), justifyContent: 'center', alignItems: 'center' },
  reflectionNum: { fontSize: rs(13), fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  reflectionQuestion: { flex: 1, fontSize: rs(14), fontWeight: '800', color: '#1A1A1A', lineHeight: rs(21) },
  reflectionInputWrap: { borderBottomWidth: 1.5, borderBottomColor: 'rgba(0,173,193,0.25)', paddingBottom: hs(6) },
  reflectionInputPremium: { fontSize: rs(14), color: '#1A1A1A', minHeight: hs(72), textAlignVertical: 'top', lineHeight: rs(22), paddingTop: 0 },
  reflectionNextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6), marginTop: hs(16), backgroundColor: '#00ADC1', borderRadius: rs(10), paddingVertical: hs(10) },
  reflectionNextBtnDisabled: { backgroundColor: '#E8E8E8' },
  reflectionNextBtnText: { fontSize: rs(13), fontWeight: '700', color: '#FFFFFF' },
  pastReflectionWrap: { marginTop: hs(14), backgroundColor: 'rgba(0,173,193,0.07)', borderRadius: rs(10), padding: rs(12) },
  pastReflectionLabel: { fontSize: rs(11), fontWeight: '700', color: '#00ADC1', marginBottom: hs(4), letterSpacing: 0.6, textTransform: 'uppercase' },
  pastReflectionText: { fontSize: rs(13), color: '#3A3A3A', fontStyle: 'italic', lineHeight: rs(20) },

  reflectionOptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: rs(12),
    padding: rs(12),
    borderWidth: 1,
  },
  reflectionRadioCircle: {
    width: rs(20),
    height: rs(20),
    borderRadius: rs(10),
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rs(12),
    marginTop: Platform.OS === 'ios' ? hs(2) : hs(3),
    flexShrink: 0,
  },
  reflectionGreenDot: {
    width: rs(10),
    height: rs(10),
    borderRadius: rs(5),
    backgroundColor: '#4CAF50',
  },
  reflectionOptionText: {
    flex: 1,
    fontSize: rs(13.5),
    lineHeight: rs(20),
    fontWeight: '500',
  },

  // ── Quiz Input ──
  inputLabel: { fontSize: rs(14), fontWeight: '800', color: '#1A1A1A', marginBottom: hs(8) },
  reflectionInputSmall: { backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#E8E8E8', borderRadius: rs(8), height: hs(60), padding: rs(12), fontSize: rs(14), color: '#1A1A1A', textAlignVertical: 'top', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },

  // ── Quiz MCQ Cards ──
  quizMcqCard: { backgroundColor: '#FFFFFF', borderRadius: rs(16), padding: rs(20), borderWidth: 1, borderColor: 'rgba(0,173,193,0.10)' },
  quizMcqHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(12), marginBottom: hs(16) },
  quizMcqBadge: { width: rs(36), height: rs(36), borderRadius: rs(10), justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  quizMcqBadgeText: { fontSize: rs(13), fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  quizMcqQuestion: { flex: 1, fontSize: rs(14), fontWeight: '800', color: '#1A1A1A', lineHeight: rs(21) },

  // ── Quiz Options (shared with mastery) ──
  quizQuestion: { fontSize: rs(16), fontWeight: '700', color: '#1A1A1A', marginBottom: hs(20) },
  quizOptions: { gap: hs(12) },
  quizOptionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: rs(8), padding: rs(16), borderWidth: 1, borderColor: '#F0F4F8' },
  quizRadio: { width: rs(20), height: rs(20), borderRadius: rs(10), borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginRight: rs(12) },
  quizRadioInner: { width: rs(10), height: rs(10), borderRadius: rs(5) },
  quizOptionText: { fontSize: rs(14), color: '#1A1A1A' },

  statusBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderRadius: rs(4), padding: rs(8) },
  statusIconWrap: { width: rs(20), height: rs(20), borderRadius: rs(10), justifyContent: 'center', alignItems: 'center', marginRight: rs(8) },
  statusText: { fontSize: rs(13), fontWeight: '600' },

  tryAgainBtn: { alignSelf: 'center', marginTop: hs(16) },
  tryAgainText: { color: '#00ADC1', fontSize: rs(14), fontWeight: '700', textDecorationLine: 'underline' },

  // ── Premium 3-Button Floating Navigation Pill ──
  floatingNavContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? hs(30) : hs(28), alignSelf: 'center', width: '90%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: rs(40), paddingHorizontal: rs(10), paddingVertical: rs(8), borderWidth: 1, borderColor: '#F0F4F8' },
  floatingNavContainerDark: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  floatingIconBtn: { width: rs(44), height: rs(44), borderRadius: rs(22), overflow: 'hidden' },
  iconCircle: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  floatingCenterBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  floatingCenterText: { fontSize: rs(16), fontWeight: '800', letterSpacing: 0.5 },

  // ── Journey screen ──
  journeyRootNew: { flex: 1 },
  journeyCardNew: { flex: 1, width: '100%', alignItems: 'center', paddingTop: hs(8), paddingHorizontal: rs(20) },
  dragHandle: { width: rs(44), height: hs(5), borderRadius: rs(2.5), backgroundColor: '#CBD5E1', marginBottom: hs(16) },
  journeyNewTitle: { fontSize: rs(28), textAlign: 'center' },
  journeyNewSub: { fontSize: rs(14), textAlign: 'center', marginTop: hs(4), marginBottom: hs(20) },
  journeyMainBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: rs(20),
    paddingVertical: hs(20),
    paddingHorizontal: rs(24),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  journeyCircleIcon: { width: rs(60), height: rs(60), borderRadius: rs(30), justifyContent: 'center', alignItems: 'center' },
  lockShackle: {
    width: rs(22),
    height: hs(14),
    borderTopLeftRadius: rs(11),
    borderTopRightRadius: rs(11),
    borderWidth: 2.5,
    borderBottomWidth: 0,
    marginBottom: hs(-2),
    alignSelf: 'center',
  },
  lockBodyContainer: {
    width: rs(50),
    height: hs(42),
    borderRadius: rs(10),
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  journeyCircleLabel: { fontSize: rs(13), fontWeight: '700', marginTop: hs(8) },
  journeyLineContainer: { flex: 1, marginHorizontal: rs(16), position: 'relative', justifyContent: 'center' },
  journeyLineBackground: { height: hs(4), borderRadius: rs(2), overflow: 'hidden', width: '100%' },
  journeyLineFill: { height: '100%', backgroundColor: '#00ADC1' },
  journeyLineDot: { position: 'absolute', width: rs(10), height: rs(10), borderRadius: rs(5), backgroundColor: '#00ADC1', marginTop: hs(-3), marginLeft: rs(-5) },
  journeyDotsContainer: { alignItems: 'center', marginVertical: hs(20) },
  journeyDotNew: { width: rs(9), height: rs(9), borderRadius: rs(4.5) },
  journeyReadsText: { fontSize: rs(14), fontWeight: '800', color: '#00ADC1', marginTop: hs(4) },
  journeyNoteText: { fontSize: rs(13.5), textAlign: 'center', marginTop: hs(8), paddingHorizontal: rs(20), lineHeight: rs(20) },
  badgeIllustrationContainer: { alignItems: 'center', marginTop: hs(6), position: 'relative' },
  outerGlowCircle: { width: rs(140), height: rs(140), borderRadius: rs(70), justifyContent: 'center', alignItems: 'center' },
  innerGlowCircle: { width: rs(106), height: rs(106), borderRadius: rs(53), justifyContent: 'center', alignItems: 'center' },
  whiteCoreCircle: { width: rs(74), height: rs(74), borderRadius: rs(37), backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#00ADC1', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  sparkleDot: { position: 'absolute', fontSize: rs(14), color: '#00ADC1', opacity: 0.8 },
  keepGoingTitle: { fontSize: rs(18), fontWeight: '900', color: '#00ADC1', marginTop: hs(12) },
  keepGoingSub: { fontSize: rs(13.5), fontWeight: '500', marginTop: hs(2) },
  doneBtnNew: { width: '80%', borderRadius: rs(10), overflow: 'hidden', marginTop: hs(24), marginBottom: hs(8), alignSelf: 'center' },
  doneBtnGradNew: { paddingVertical: hs(14), alignItems: 'center', justifyContent: 'center', borderRadius: rs(10) },
  doneBtnTextNew: { fontSize: rs(16), fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  bottomWaveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: hs(95),
    overflow: 'hidden',
    zIndex: 0,
  },
  journeyRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: rs(24) },
  journeyCard: { width: '100%', borderRadius: rs(16), paddingTop: hs(30), alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#F0F4F8', backgroundColor: '#FFFFFF' },
  journeyTitle: { fontSize: rs(28), fontWeight: '900', color: '#4CD6E8', marginBottom: hs(6), letterSpacing: 0.2 },
  journeySub: { fontSize: rs(13), color: '#666', marginBottom: hs(36), textAlign: 'center' },
  journeyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: hs(40) },
  journeyStepCard: { width: rs(105), height: rs(105), backgroundColor: '#FFFFFF', borderRadius: rs(8), justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0, 173, 193, 0.1)' },
  journeyImg: { width: rs(44), height: rs(44), marginBottom: hs(8) },
  journeyStepLabel: { fontSize: rs(12), fontWeight: '600', color: '#1A1A1A' },
  journeyLineWrap: { width: rs(60), height: 2, flexDirection: 'row' },
  journeyLineLeft: { flex: 1, backgroundColor: '#FFD54F' },
  journeyLineRight: { flex: 1, backgroundColor: '#00ADC1' },
  journeyProgressRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: hs(16), marginTop: hs(-20) },
  journeyDot: { width: rs(10), height: rs(10), borderRadius: rs(5) },
  journeyDotFilled: { backgroundColor: '#00ADC1' },
  journeyDotEmpty: { backgroundColor: '#D0EEF2' },
  journeyProgressLabel: { fontSize: rs(12), fontWeight: '700', color: '#00ADC1', marginLeft: rs(4) },
  journeyNote: { fontSize: rs(13), color: '#7A7A7A', textAlign: 'center', paddingHorizontal: rs(30), marginBottom: hs(24), lineHeight: rs(20) },
  doneBtn: { width: '100%', overflow: 'hidden' },
  doneBtnGrad: { paddingVertical: hs(18), alignItems: 'center', backgroundColor: '#00ADC1' },
  doneBtnText: { fontSize: rs(18), fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
});

export default NameDetailScreen;
