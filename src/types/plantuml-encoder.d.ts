declare module 'plantuml-encoder' {
  const plantumlEncoder: {
    encode(puml: string): string;
    decode(encoded: string): string;
  };
  export default plantumlEncoder;
}
