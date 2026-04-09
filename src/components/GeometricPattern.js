import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

// ─── Single 8-pointed star tile (two overlapping squares) ──────────────────────
const StarTile = ({ x, y, size, color, opacity }) => (
  <View style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ position: 'absolute', width: size, height: size, borderWidth: 0.9, borderColor: color, opacity }} />
    <View style={{ position: 'absolute', width: size, height: size, borderWidth: 0.9, borderColor: color, opacity, transform: [{ rotate: '45deg' }] }} />
  </View>
);

// ─── Connecting diamond (placed between star tiles) ────────────────────────────
const DiamondTile = ({ x, y, size, color, opacity }) => (
  <View style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderWidth: 0.7, borderColor: color, opacity, transform: [{ rotate: '45deg' }] }} />
);

// ─── Dense Islamic geometric tile grid ─────────────────────────────────────────
const GeometricPattern = ({ color = '#8B6914', isDark, cardW = 400, cardH = 600 }) => {
  const TILE  = 84;  // grid spacing — larger tile = far fewer Views = fast render
  const STAR  = 56;  // star square size  (≈ TILE * 0.67)
  const DIAM  = 22;  // connecting diamond size
  const op    = isDark ? 0.09 : 0.11;  // tile opacity

  const tiles = useMemo(() => {
    const cols = Math.ceil((cardW  + TILE) / TILE) + 1;
    const rows = Math.ceil((cardH  + TILE) / TILE) + 1;
    const stars    = [];
    const diamonds = [];

    for (let c = -1; c < cols; c++) {
      for (let r = -1; r < rows; r++) {
        const x = c * TILE;
        const y = r * TILE;
        stars.push({ x, y, key: `s${c}-${r}` });

        // Mid-point diamonds between star centres
        diamonds.push({ x: x + TILE / 2, y,            key: `dh${c}-${r}` });
        diamonds.push({ x,               y: y + TILE / 2, key: `dv${c}-${r}` });
      }
    }
    return { stars, diamonds };
  }, [cardW, cardH]);

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      {tiles.stars.map(({ x, y, key }) => (
        <StarTile key={key} x={x} y={y} size={STAR} color={color} opacity={op} />
      ))}
      {tiles.diamonds.map(({ x, y, key }) => (
        <DiamondTile key={key} x={x} y={y} size={DIAM} color={color} opacity={op * 0.8} />
      ))}
    </View>
  );
};

export default GeometricPattern;
