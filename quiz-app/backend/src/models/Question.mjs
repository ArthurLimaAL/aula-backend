import mongoose from 'mongoose';

// Define a estrutura das perguntas do quiz
const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'O texto da pergunta é obrigatório.'],
    trim: true
  },
  options: {
    type: [String],
    required: [true, 'As opções de resposta são obrigatórias.'],
    // Validação customizada para garantir que o quiz tenha sempre opções de escolha
    validate: [arrayLimit, 'A pergunta deve ter pelo menos 2 opções.']
  },
  answer: {
    type: String,
    required: [true, 'A resposta correta é obrigatória.'],
    trim: true
  }
}, {
  timestamps: true
});

// Função auxiliar de validação para o tamanho do array de opções
function arrayLimit(val){
  return val.length >= 2;
}

const Question = mongoose.model('Question', questionSchema);

export default Question;