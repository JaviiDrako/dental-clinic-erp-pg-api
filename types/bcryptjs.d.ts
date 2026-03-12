declare module 'bcryptjs' {
  export function hash(s: string, salt: number): Promise<string>;
  export function compare(s: string, hash: string): Promise<boolean>;
  export function genSalt(rounds?: number): Promise<number>;
  export function hashSync(s: string, salt: number): string;
  export function compareSync(s: string, hash: string): boolean;
  export function genSaltSync(rounds?: number): number;
}
