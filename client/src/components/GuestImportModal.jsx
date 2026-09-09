import React, { useState } from 'react';
import { TailwindModal } from './TailwindModal';
import { Upload, FileText, Download, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

// Standard Guest Schema Target Fields
const TARGET_FIELDS = [
  { key: 'name', label: 'Guest Name *', required: true, match: ['name', 'full name', 'guest', 'guest name'] },
  { key: 'phone', label: 'Phone Number', match: ['phone', 'mobile', 'contact', 'cell', 'phone number'] },
  { key: 'email', label: 'Email Address', match: ['email', 'mail', 'email address'] },
  { key: 'relationship_category', label: 'Relation Category', match: ['category', 'relation category', 'group category'] },
  { key: 'relationship_detail', label: 'Relation Detail', match: ['relation', 'relationship', 'relationship detail', 'role'] },
  { key: 'household_name', label: 'Household / Family', match: ['household', 'family', 'group', 'household name', 'family name'] },
  { key: 'guest_type', label: 'Guest Type', match: ['type', 'guest type', 'individual/family'] },
  { key: 'rsvp_status', label: 'Status', match: ['status', 'rsvp', 'rsvp status', 'attendance rsvp'] },
  { key: 'expected_attendees', label: 'Expected Headcount', match: ['headcount', 'members', 'total members', 'expected', 'expected count', 'attendees'] },
  { key: 'events', label: 'Wedding Events', match: ['events', 'ceremonies', 'functions'] },
  { key: 'tags', label: 'Tags', match: ['tags', 'tag', 'labels'] }
];

export function GuestImportModal({ isOpen, onClose, onImportSuccess }) {
  const toast = useToast();
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [step, setStep] = useState('upload'); // 'upload' | 'map'
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setCsvText('');
    setParsedRows([]);
    setHeaders([]);
    setColumnMap({});
    setStep('upload');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Simple, robust RFC-4180 CSV parser
  const parseCSV = (text) => {
    const lines = text.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
    if (lines.length < 2) throw new Error('CSV must contain a header row and at least one data row.');

    // Auto detect delimiter (comma, semicolon, or tab)
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(';') ? ';' : ',');

    const splitLine = (line) => {
      const result = [];
      let current = '';
      let insideQuote = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (insideQuote && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            insideQuote = !insideQuote;
          }
        } else if (char === delimiter && !insideQuote) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headerRow = splitLine(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim());
    const dataRows = lines.slice(1).map(l => splitLine(l));

    return { headers: headerRow, rows: dataRows };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || '';
      processText(text);
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  };

  const processText = (text) => {
    setError('');
    try {
      const { headers: parsedHeaders, rows } = parseCSV(text);
      if (parsedHeaders.length === 0) throw new Error('No headers found in CSV.');
      if (rows.length === 0) throw new Error('No data rows found in CSV.');

      setHeaders(parsedHeaders);
      setParsedRows(rows);

      // Auto map columns with fuzzy matching
      const initialMap = {};
      TARGET_FIELDS.forEach(tf => {
        const foundHeader = parsedHeaders.find(h => 
          tf.match.some(m => h.toLowerCase().trim() === m || h.toLowerCase().includes(m))
        );
        if (foundHeader) {
          initialMap[tf.key] = foundHeader;
        }
      });
      setColumnMap(initialMap);
      setStep('map');
    } catch (err) {
      setError(err.message || 'Invalid CSV format.');
    }
  };

  const handleDownloadSample = () => {
    const sample = `Guest Name,Phone,Email,Relation,Status,Members,Events,Tags
Rahul Sharma,9876543210,rahul@example.com,College Friend,Confirmed,2,"Sangeet, Wedding","College Friends, VIP"
Amit Sharma,9876543211,amit@example.com,Uncle,Confirmed,4,"Haldi, Sangeet, Wedding",Close Family
Priya Verma,9876543212,priya@example.com,Friend,Maybe,1,"Mehendi, Sangeet, Wedding",
Sunita Sharma,9876543213,,Aunt,Confirmed,1,"Mehendi, Haldi, Wedding",Family`;

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'wedding_guests_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = async () => {
    if (!columnMap.name) {
      setError('Please map a column to "Guest Name".');
      return;
    }

    setImporting(true);
    setError('');
    try {
      const guestsToImport = parsedRows.map(row => {
        const getVal = (targetKey) => {
          const headerName = columnMap[targetKey];
          if (!headerName) return '';
          const idx = headers.indexOf(headerName);
          return idx !== -1 ? row[idx] || '' : '';
        };

        const name = getVal('name');
        if (!name) return null;

        const rawEvents = getVal('events');
        const events = rawEvents
          ? rawEvents.split(/[,;|]/).map(e => e.trim()).filter(Boolean)
          : ['Mehendi', 'Haldi', 'Wedding'];

        const rawTags = getVal('tags');
        const tags = rawTags
          ? rawTags.split(/[,;|]/).map(t => t.trim().replace(/^#/, '')).filter(Boolean)
          : [];

        const members = parseInt(getVal('expected_attendees'), 10) || 1;

        return {
          name,
          phone: getVal('phone'),
          email: getVal('email'),
          relationship_category: getVal('relationship_category') || 'Family',
          relationship_detail: getVal('relationship_detail'),
          household_name: getVal('household_name'),
          guest_type: getVal('guest_type') || (members > 1 ? 'Family' : 'Individual'),
          rsvp_status: (getVal('rsvp_status') === 'Not Responded' || !getVal('rsvp_status')) ? 'Pending Invitation' : getVal('rsvp_status'),
          expected_adults: members,
          expected_children: 0,
          expected_attendees: members,
          events,
          tags
        };
      }).filter(Boolean);

      if (guestsToImport.length === 0) {
        throw new Error('No valid guest records with names found to import.');
      }

      await onImportSuccess(guestsToImport);
      toast({
        title: 'Import Successful',
        description: `Successfully imported ${guestsToImport.length} guests.`,
        status: 'success'
      });
      handleClose();
    } catch (err) {
      setError(err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <TailwindModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Guests from CSV / Excel"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-lg flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-600">
                Upload a CSV spreadsheet or paste text to bulk-import your wedding guests.
              </p>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#234c6a] hover:underline cursor-pointer"
              >
                <Download size={13} />
                <span>Download Sample CSV</span>
              </button>
            </div>

            {/* Drag & Drop File Box */}
            <div className="border-2 border-dashed border-zinc-200 hover:border-[#234c6a] rounded-xl p-6 text-center transition-colors bg-zinc-50/50">
              <Upload size={32} className="mx-auto text-[#456882] mb-2" />
              <label className="text-xs font-semibold text-[#234c6a] hover:underline cursor-pointer">
                <span>Choose a CSV file</span>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-zinc-400 mt-1">Accepts UTF-8 formatted .CSV files</p>
            </div>

            {/* Paste Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700">Or Paste CSV Data Below</label>
              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Guest Name, Phone, Relation, Status&#10;Rahul Sharma, 9876543210, Friend, Confirmed"
                className="w-full p-3 font-mono text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 focus:border-[#234c6a]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!csvText.trim()}
                onClick={() => processText(csvText)}
                className="px-4 py-2 text-xs font-semibold bg-[#234c6a] text-white hover:bg-[#1b3c53] rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Continue to Mapping →
              </button>
            </div>
          </div>
        )}

        {step === 'map' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-800">Map CSV Columns to Guest Fields</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Found <strong className="text-zinc-900">{parsedRows.length}</strong> rows. Match columns below:
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep('upload')}
                className="text-xs text-[#234c6a] font-medium hover:underline cursor-pointer"
              >
                ← Change File
              </button>
            </div>

            {/* Mapping Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
              {TARGET_FIELDS.map(tf => (
                <div key={tf.key} className="p-2.5 rounded-lg border border-zinc-200 bg-white flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-zinc-800 block truncate">
                      {tf.label}
                    </span>
                  </div>

                  <select
                    value={columnMap[tf.key] || ''}
                    onChange={(e) => setColumnMap(prev => ({ ...prev, [tf.key]: e.target.value }))}
                    className={`h-8 px-2 text-xs rounded border bg-white max-w-[160px] truncate ${
                      columnMap[tf.key] ? 'border-[#234c6a] text-[#1b3c53] font-semibold' : 'border-zinc-200 text-zinc-500'
                    }`}
                  >
                    <option value="">(Ignore field)</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Data Preview Table (First 3 rows) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-700">Preview (First 3 Rows):</span>
              <div className="overflow-x-auto border border-zinc-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100/90 border-b border-zinc-200/80 font-semibold text-zinc-500">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Category</th>
                      <th className="p-2">Guest Type</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                    {parsedRows.slice(0, 3).map((row, idx) => {
                      const getPreviewVal = (key) => {
                        const h = columnMap[key];
                        if (!h) return '—';
                        const i = headers.indexOf(h);
                        return i !== -1 ? (row[i] || '—') : '—';
                      };
                      return (
                        <tr key={idx} className="hover:bg-zinc-50">
                          <td className="p-2 font-semibold text-zinc-900">{getPreviewVal('name')}</td>
                          <td className="p-2 text-zinc-600">{getPreviewVal('phone')}</td>
                          <td className="p-2 text-zinc-600">{getPreviewVal('relationship_category')}</td>
                          <td className="p-2 text-zinc-600">{getPreviewVal('guest_type')}</td>
                          <td className="p-2 text-zinc-600">{getPreviewVal('rsvp_status')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import Button */}
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={importing || !columnMap.name}
                onClick={handleExecuteImport}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-[#234c6a] text-white hover:bg-[#1b3c53] rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Import {parsedRows.length} Guests</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </TailwindModal>
  );
}
