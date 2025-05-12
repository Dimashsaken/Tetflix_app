import React from 'react';
import Svg, { Text, TSpan } from 'react-native-svg';

interface TetflixLogoProps {
  width?: number;
  height?: number;
  color?: string;
}

const TetflixLogo: React.FC<TetflixLogoProps> = ({ 
  width = 200, 
  height = 60,
  color = '#E21221'
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 60">
      <Text
        x="100"
        y="40"
        textAnchor="middle"
        fontWeight="bold"
        fontSize="42"
        letterSpacing="1"
        fill={color}
        fontFamily="System"
      >
        <TSpan>TETFLIX</TSpan>
      </Text>
    </Svg>
  );
};

export default TetflixLogo; 