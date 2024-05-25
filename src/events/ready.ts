import { container } from 'tsyringe';
import { kLogger } from '../util/tokens';
import { createEvent } from '../util/Event';
import type { Logger } from '../util/Logger';
import { GameManagement } from '../util/GameManagement';

const logger = container.resolve<Logger>(kLogger);
const gameManagement = container.resolve(GameManagement);

export default createEvent('ready')
  .setOn(async () => {
    logger.info('Online!');
    await gameManagement.loadGames();
  })
  .build();
