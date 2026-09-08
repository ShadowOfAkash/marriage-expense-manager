const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

if (!code.includes('ActionMenu')) {
  code = code.replace(/import \{ TailwindModal \} from '\.\/TailwindModal';/, "import { TailwindModal } from './TailwindModal';\nimport { ActionMenu } from './ActionMenu';");

  // Remove the DOCUMENT TH header
  // <th className="py-3 px-4 font-medium text-center whitespace-nowrap">DOCUMENT</th>
  code = code.replace(/<th className="py-3 px-4 font-medium text-center whitespace-nowrap">DOCUMENT<\/th>\n/, "");

  // Remove the DOCUMENT TD
  const oldDocTd = `<td className="py-3 px-4 text-center">
                      {e.receipt_url ? (
                        <Button isIconOnly size="sm" variant="light" className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200" onClick={() => setViewerUrl(e.receipt_url)}>
                          <ImageIcon size={16} />
                        </Button>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>`;
  code = code.replace(oldDocTd, "");

  // Rewrite the ACTIONS TD
  const oldActionTd = `<td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button isIconOnly size="sm" variant="light" className="text-blue-600 hover:bg-blue-50" onClick={() => openEdit(e)}><Pencil size={14} /></Button>
                        <Button isIconOnly size="sm" variant="light" className="text-red-600 hover:bg-red-50" onClick={() => confirmDelete(e.id)}><Trash2 size={14} /></Button>
                      </div>
                    </td>`;

  const newActionTd = `<td className="py-3 px-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {e.receipt_url && (
                          <button onClick={() => setViewerUrl(e.receipt_url)} className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors" title="View Document">
                            <Paperclip size={18} />
                          </button>
                        )}
                        <ActionMenu onEdit={() => openEdit(e)} onDelete={() => confirmDelete(e.id)} />
                      </div>
                    </td>`;
  
  code = code.replace(oldActionTd, newActionTd);

  fs.writeFileSync('client/src/components/Expenses.jsx', code);
  console.log("Patched Expenses.jsx actions");
}
