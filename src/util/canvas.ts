import { Canvas, Image, loadImage } from 'canvas-constructor/skia';
import { colors } from './colors';

const boardColors = {
  background: '#36393E',
  playerGradient: '#FFFFFF',
  white: '#FFFFFF',
};

export async function gameImageGenerator(context: {
  players: {
    userId: string;
    avatarUrl: string;
    x: number;
    y: number;
    lives: number;
    range: number;
    color: string;
  }[];
  width: number;
  height: number;
}) {
  const playerImages: Record<string, Image> = {};
  const canvas = new Canvas(context.width * 20, context.height * 20);

  canvas
    .setColor(boardColors.background)
    .printRectangle(0, 0, canvas.width, canvas.height);

  const cellWidth = Math.floor(canvas.width / context.width);
  const cellHeight = Math.floor(canvas.width / context.width);

  for await (const player of context.players) {
    const image = await loadImage(player.avatarUrl);
    playerImages[player.userId] = image;
  }

  for (let y = 0; y < context.height; y++) {
    for (let x = 0; x < context.width; x++) {
      const closestPlayers = getClosestPlayers(context.players, x, y);
      const closestPlayer = closestPlayers[0];

      canvas.setColor(boardColors.white);

      const alpha = Math.max((20 - closestPlayer.gradientRange) / 20, 0);
      let relevantPlayers = closestPlayers.filter(
        (v) => v.range <= v.player.range
      );

      canvas.save();
      canvas.translate(x * cellWidth, y * cellHeight);
      if (closestPlayer.range !== 0) {
        if (relevantPlayers.length > 0) {
          const gradient = canvas.createLinearGradient(
            0,
            0,
            cellWidth,
            cellHeight
          );

          for (const [i, relevantPlayer] of relevantPlayers.entries()) {
            let offset = 1 / relevantPlayers.length;
            const color =
              colors[relevantPlayer.player.color as keyof typeof colors];

            gradient.addColorStop(offset * i, color);
            gradient.addColorStop(offset * (i + 1) - 0.05, color);
          }
          canvas
            .setColor(gradient)
            .printRectangle(0, 0, cellWidth - 1, cellHeight - 1);
        } else {
          canvas
            .setGlobalAlpha(alpha)
            .setColor(boardColors.playerGradient)
            .printRectangle(0, 0, cellWidth - 1, cellHeight - 1);
        }
      }
      canvas.restore();

      if (closestPlayer.range === 0) {
        canvas
          .setGlobalAlpha(1)
          .printImage(
            playerImages[closestPlayer.player.userId],
            x * cellWidth,
            y * cellHeight,
            cellWidth - 1,
            cellHeight - 1
          );
      }
    }
  }
  return canvas.toBufferAsync('png');
}

function getClosestPlayers(
  players: {
    userId: string;
    x: number;
    y: number;
    avatarUrl: string;
    lives: number;
    range: number;
    color: string;
  }[],
  x: number,
  y: number
) {
  return players
    .filter((player) => player.lives > 0)
    .map((player) => {
      const distanceX = Math.abs(x - player.x);
      const distanceY = Math.abs(y - player.y);
      return {
        player,
        gradientRange: Math.sqrt(distanceX * distanceX + distanceY * distanceY),
        range: Math.max(distanceX, distanceY),
      };
    })
    .sort((a, b) => a.gradientRange - b.gradientRange);
}
