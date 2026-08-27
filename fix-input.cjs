const fs = require('fs');
let content = fs.readFileSync('src/shared/components/LayoutBlocks.tsx', 'utf8');

content = content.replace(
    /"flex h-12 w-full rounded-2xl border border-border\/20 bg-white\/5 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 text-foreground backdrop-blur-md transition-\[background-color,border-color,box-shadow,transform\] duration-300 ease-out relative z-10"/,
    '"flex h-12 w-full rounded-2xl border border-border/30 bg-white/5 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 text-foreground backdrop-blur-md transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out relative z-10"'
);

content = content.replace(
    /"border-destructive\/50 focus-visible:border-transparent motion-safe:animate-pulse"/,
    '"border-destructive focus-visible:ring-destructive"'
);

fs.writeFileSync('src/shared/components/LayoutBlocks.tsx', content);
console.log('Fixed input styles');
