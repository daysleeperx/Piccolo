import { DialogueApplication, DialogueApplicationOptions } from './DialogueApplication';
import { MidiApplication, MidiSourceAppOptions } from './MidiApplication';
import { SequentialApplication } from './SequentialApplication';

/**
 * Represents a Command Line interface.
 */
export type CLIOptions = MidiSourceAppOptions | DialogueApplicationOptions;

export enum ApplicationMode {
  MIDI,
  DIALOGUE,
  SEQUENTIAL
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
  public async createApplication(mode: ApplicationMode): Promise<CLIApplication> {
    switch (mode) {
      case ApplicationMode.MIDI:
        return MidiApplication.createAndInit();
      case ApplicationMode.DIALOGUE:
        return DialogueApplication.createAndInit();
      case ApplicationMode.SEQUENTIAL:
        return SequentialApplication.createAndInit();
    }
  }
}
