import { MidiApplication, MidiSourceAppOptions } from './MidiApplication';

/**
 * Represents a Command Line interface.
 */
export type CLIOptions = MidiSourceAppOptions;

export enum ApplicationMode {
  MIDI,
  DIALOG,
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
  public createApplication(mode: ApplicationMode, options: CLIOptions): CLIApplication {
    switch (mode) {
      case ApplicationMode.MIDI:
        return MidiApplication.createAndInit(options as MidiSourceAppOptions);
      case ApplicationMode.DIALOG:
        throw new Error('Not implemented!');
      case ApplicationMode.SEQUENTIAL:
        throw new Error('Not implemented!');
    }
  }
}
