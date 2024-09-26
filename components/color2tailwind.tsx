import React, { useRef } from 'react';
import { Button } from './ui/button';

interface Color2TailwindProps {
  setInput: React.Dispatch<React.SetStateAction<string>>;
  readingImg: boolean;
  setReadingImg: React.Dispatch<React.SetStateAction<boolean>>;
  isStreaming: boolean;
}

const tailwindColors = {
  red: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
  orange: ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'],
  yellow: ['#fefce8', '#fef9c3', '#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12'],
  green: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'],
  blue: ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
  indigo: ['#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'],
  purple: ['#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87'],
  pink: ['#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843'],
};

const findClosestTailwindColor = (r: number, g: number, b: number) => {
  const validShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  let closestColor = '';
  let minDistance = Infinity;
  Object.entries(tailwindColors).forEach(([colorName, shades]) => {
    shades.forEach((hexColor, index) => {
      const [tr, tg, tb] = hexToRgb(hexColor);
      const distance = Math.sqrt((r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = `bg-${colorName}-${validShades[index]} text-${validShades[index]<400?'black':'white'}`;
      }
    });
  });
  return closestColor;
};

const hexToRgb = (hex: string) => {
  const bigint = parseInt(hex.slice(1), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

const Color2Tailwind: React.FC<Color2TailwindProps> = ({ setInput, readingImg, setReadingImg, isStreaming }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReadingImg(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const colorCounts: { [key: string]: number } = {};

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const tailwindColor = findClosestTailwindColor(r, g, b);
              colorCounts[tailwindColor] = (colorCounts[tailwindColor] || 0) + 1;
            }

            const sortedColors = Object.entries(colorCounts)
              .map(([color, count]) => ({ color, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 4);

            const mainColorResult = sortedColors[0];
            const palette = sortedColors.slice(1);
            const result = `Color and ouput the FULL PAGE with main color: ${mainColorResult.color}, other ref: ${palette.map(color => `${color.color}`).join(',')}`;
            setInput(prevInput => prevInput + (prevInput.length > 0 ? '\n\n' : '') + result);
            setReadingImg(false);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        ref={fileInputRef}
      />
      <Button
        variant='outline'
        onClick={handleButtonClick}
        className='w-32'
        disabled={readingImg || isStreaming}
      >
        {readingImg ? 'Reading...' : 'Upload Image'}
      </Button>
    </div>
  );
};

export default Color2Tailwind;