const fs = require('fs');
let content = fs.readFileSync('server/db.ts', 'utf8');

// Fix the try/catch structure in seedAdditionalPitchCardsOnce
// The issue is the misplaced } before catch
const oldStructure = `      }
    } catch (err) {
      console.error('Erro ao inserir cards semente:', err);
      throw new Error('Não foi possível criar cards de teste. Tente reiniciar a aplicação.');
    }
  });`;

const newStructure = `      }
    }
  });
`;

if (content.includes(oldStructure)) {
  content = content.replace(oldStructure, newStructure);
  fs.writeFileSync('server/db.ts', content, 'utf8');
  console.log('Structure fixed - removed catch block');
} else {
  console.log('Structure not found');
  // Try alternative
  console.log('Looking for alternative patterns...');
}

// Check if try block is properly formed
const checkPattern = `try {`;
if (content.includes(checkPattern)) {
  console.log('try { found in file');
} else {
  console.log('try { NOT found in file');
}