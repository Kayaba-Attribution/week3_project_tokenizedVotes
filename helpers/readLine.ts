import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

export const question = (questionText: string): Promise<string> => {
  return new Promise(resolve => rl.question(questionText, resolve));
};

export const closeInterface = (): void => {
  rl.close();
};