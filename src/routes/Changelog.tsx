import type { JSX } from 'solid-js';
import { marked } from 'marked';
import changelogRaw from '../../CHANGELOG.md?raw';

const html = marked.parse(changelogRaw);

const Changelog = (): JSX.Element => {
  return (
    <div class="flex-1 overflow-y-auto py-8 pr-4 min-h-0">
      <div
        class={[
          'max-w-2xl',
          '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4',
          '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:pt-4 [&_h2]:border-t [&_h2]:border-border first:[&_h2]:border-t-0 first:[&_h2]:mt-0 first:[&_h2]:pt-0',
          '[&_h3]:text-xs [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:text-muted-foreground [&_h3]:mt-4 [&_h3]:mb-1.5',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1',
          '[&_li]:text-sm [&_li]:text-muted-foreground',
          '[&_p]:text-sm [&_p]:text-muted-foreground [&_p]:mb-2',
          '[&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline',
          '[&_strong]:font-semibold [&_strong]:text-foreground',
          '[&_code]:font-mono [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded',
        ].join(' ')}
        innerHTML={html}
      />
    </div>
  );
};

export default Changelog;
