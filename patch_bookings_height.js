const fs = require('fs');
let code = fs.readFileSync('client/src/components/Bookings.jsx', 'utf8');

// Wrapper height to full page
code = code.replace(
  /<div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">/,
  `<div className="p-4 md:p-6 max-w-7xl mx-auto h-[calc(100vh-0rem)] md:h-[calc(100vh-2rem)] flex flex-col">`
);

// Reduce margin on header to save space
code = code.replace(
  /<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">/,
  `<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 shrink-0">`
);

// Reduce margin on search card
code = code.replace(
  /<Card className="mb-6 shadow-sm border border-zinc-200">/,
  `<Card className="mb-4 shadow-sm border border-zinc-200 shrink-0">`
);

// Make table card flex-1 and scrollable
code = code.replace(
  /<Card className="shadow-sm border border-zinc-200">/,
  `<Card className="shadow-sm border border-zinc-200 flex-1 flex flex-col overflow-hidden">`
);

code = code.replace(
  /<div className="overflow-x-auto w-full">/,
  `<div className="overflow-auto flex-1 w-full relative">`
);

// Make table headers sticky
code = code.replace(
  /<thead(.*?)>/,
  `<thead$1 className="sticky top-0 bg-zinc-50 z-10 shadow-[0_1px_0_0_#e4e4e7]">`
);
code = code.replace(
  /<tr className="border-b border-zinc-200 text-zinc-500 font-medium bg-zinc-50">/,
  `<tr className="text-zinc-500 font-medium bg-zinc-50">`
); // removed border-b since we use box-shadow for sticky headers to prevent scrolling gap issues

fs.writeFileSync('client/src/components/Bookings.jsx', code);
console.log("Patched Bookings.jsx height");
