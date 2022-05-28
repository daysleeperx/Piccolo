import UnreachableCode from '../common/UnreachableCode';
import DialogueApplication from './DialogueApplication';
import { MidiApplication, MidiSourceAppOptions } from './MidiApplication';
import SequentialApplication from './SequentialApplication';

/**
 * Represents a Command Line interface.
 */
export type CLIOptions = MidiSourceAppOptions;

export enum ApplicationMode {
  MIDI = 'MIDI',
  DIALOGUE = 'DIALOGUE',
  SEQUENTIAL = 'SEQUENTIAL'
}

export interface CLIApplication {
  /**
   * Main method.
   */
  run(): Promise<void>;
}

export class CLIApplicationFactory {
  /**
   * Factory method to create CLI apps based on different modes.
   *
   * @param {ApplicationMode} mode
   * @returns {CLIApplication}
   */
  public static async createApplication(mode: ApplicationMode): Promise<CLIApplication> {
    switch (mode) {
      case ApplicationMode.MIDI:
        return MidiApplication.createAndInit();
      case ApplicationMode.DIALOGUE:
        return DialogueApplication.createAndInit();
      case ApplicationMode.SEQUENTIAL:
        return SequentialApplication.createAndInit();
      default:
        return UnreachableCode.never(mode);
    }
  }
}
