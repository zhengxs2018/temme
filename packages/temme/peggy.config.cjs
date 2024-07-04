module.exports = {
  input: 'src/ast/grammar.peggy',
  output: 'src/ast/index.js',
  format: 'es',
  allowedStartRules: ['Start'],
};
