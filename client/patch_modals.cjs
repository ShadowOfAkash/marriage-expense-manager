const fs = require('fs');

function patchFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  
  // Replace imports
  if (!content.includes('TailwindModal')) {
    content = content.replace("import {", "import { TailwindModal } from './TailwindModal';\nimport {");
  }

  // Replace <Modal ...> with <TailwindModal title="...">
  content = content.replace(/<Modal isOpen={([^}]+)} onOpenChange={([^}]+)}[^>]*>\s*<Modal\.Dialog>\s*<Modal\.Header[^>]*>.*?<span>(.*?)<\/span>.*?<\/Modal\.Header>\s*<Modal\.Body[^>]*>/gs, (match, isOpen, onOpen, title) => {
    return `<TailwindModal isOpen={${isOpen}} onClose={() => ${isOpen} === isOpen ? ${onOpen}(false) : ${onOpen}()} title="${title}">`;
  });
  content = content.replace(/<\/Modal\.Body>\s*<\/Modal\.Dialog>\s*<\/Modal>/g, '</TailwindModal>');
  
  fs.writeFileSync(path, content);
}

patchFile('src/components/SharedModals.jsx');
patchFile('src/components/Dashboard.jsx');
