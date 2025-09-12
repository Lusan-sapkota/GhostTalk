import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type Variant = 'rect' | 'text' | 'circle';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  variant?: Variant;
  count?: number; // render multiple lines
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 12,
  borderRadius,
  style,
  variant = 'text',
  count = 1,
}) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const animated = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animated, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(animated, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animated]);

  const renderOne = (i: number) => {
    const w = variant === 'text' ? (i === 0 ? width : '90%') : width;
    const h = variant === 'text' ? (i === 0 ? height + 6 : height) : height;
    const br = variant === 'circle' ? 9999 : borderRadius ?? (variant === 'text' ? 4 : 6);

    return (
      <Animated.View
        key={i}
        style={[
          { width: w, height: h, borderRadius: br, backgroundColor: colors.tabIconDefault, opacity: animated },
          styles.item,
          style,
        ]}
      />
    );
  };

  if (count <= 1) return renderOne(0);

  const items = [] as any[];
  for (let i = 0; i < count; i++) items.push(renderOne(i));
  return <View style={styles.group}>{items}</View>;
};

export default Skeleton;

const styles = StyleSheet.create({
  item: {
    marginVertical: 6,
  },
  group: {
    width: '100%',
  },
});
