export class PlayerDoesNotExistInGameError extends Error {
  constructor() {
    super('Player does not exist in game');
  }
}

export class PlayerToGiftDoesNotExistInGameError extends Error {
  constructor() {
    super('Player to gift does not exist in game');
  }
}

export class GameNotFoundError extends Error {
  constructor() {
    super('Game not found');
  }
}

export class NotEnoughPointsToWalkThatFarError extends Error {
  constructor() {
    super('Not enough points to walk that far');
  }
}

export class InvalidDirectionError extends Error {
  constructor() {
    super('Invalid direction');
  }
}

export class NotEnoughPointsToIncreaseRangeError extends Error {
  constructor() {
    super('Not enough points to increase range');
  }
}

export class NotEnoughPointsToSubtractError extends Error {
  constructor() {
    super('Not enough points to subtract');
  }
}

export class NoLivesLeftError extends Error {
  constructor() {
    super('No lives left');
  }
}

export class PlayerToGiftIsOutOfRangeError extends Error {
  constructor() {
    super('Player to gift is out of range');
  }
}

export class PlayerIsNotAliveError extends Error {
  constructor() {
    super('Player is not alive');
  }
}

export class PlayerDoesNotHavePointsToAttackError extends Error {
  constructor() {
    super('Player does not have points to attack');
  }
}

export class GiftAmountUnderMinimumError extends Error {
  constructor() {
    super('Gift amount under minimum');
  }
}

export class PlayerToGiftToIsDeadError extends Error {
  constructor() {
    super('Player to gift to is dead');
  }
}

export class PlayerToAttackIsDeadError extends Error {
  constructor() {
    super('Player to attack is dead');
  }
}

export class PlayerToAttackIsNotInGame extends Error {
  constructor() {
    super('Player to attack is not in game');
  }
}

export class PlayerToAttackIsOutOfRangeError extends Error {
  constructor() {
    super('Player to attack is out of range');
  }
}

export class GameNotInSetupModeError extends Error {
  constructor() {
    super('Game not in setup mode');
  }
}

export class PlayerIsAlreadyInGameError extends Error {
  constructor() {
    super('Player is already in game');
  }
}

export class GameNotInStartingModeError extends Error {
  constructor() {
    super('Game not in starting mode');
  }
}

export class GameIsNotStartedError extends Error {
  constructor() {
    super('Game is not started mode');
  }
}
