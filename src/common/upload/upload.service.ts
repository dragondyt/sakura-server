import { Injectable } from '@nestjs/common';
import { Strategy } from './upload.strategy';
import { DetaStrategy } from './strategy/upload.strategy.deta';
import { SmStrategy } from './strategy/upload.strategy.sm';

@Injectable()
export class UploadStrategyFactory {
  createStrategy(strategyName: string): Strategy {
    switch (strategyName) {
      case 'deta':
        return new DetaStrategy();
      case 'sm':
        return new SmStrategy();
      default:
        throw new Error('Invalid strategy name');
    }
  }
}
