import ora, { type Ora } from 'ora';

export class Logger {
  private spinner: Ora | null = null;
  private silent: boolean;

  constructor(silent: boolean = false) {
    this.silent = silent;
  }

  start(message: string): void {
    if (this.silent) return;
    this.spinner = ora(message).start();
  }

  succeed(message?: string): void {
    if (this.silent || !this.spinner) return;
    this.spinner.succeed(message);
  }

  fail(message: string): void {
    if (this.silent) {
      console.error(`Error: ${message}`);
      return;
    }
    if (this.spinner) {
      this.spinner.fail(message);
    } else {
      console.error(`Error: ${message}`);
    }
  }

  info(message: string): void {
    if (this.silent) return;
    if (this.spinner) {
      this.spinner.info(message);
    } else {
      console.log(message);
    }
  }

  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
}
