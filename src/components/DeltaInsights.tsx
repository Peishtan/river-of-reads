import { useMemo } from 'react';
import { MonthData, VibeGroup, vibeLabels, VIBES } from '@/data/readingData';
import { useReadingData } from '@/contexts/ReadingDataContext';

const DeltaInsights = () => {
  const { data: rawReadingData, riverColors } = useReadingData();
  const readingData = useMemo(() => rawReadingData.filter(d => d.year >= 2021), [rawReadingData]);

  const insights = useMemo(() => {
    if (readingData.length < 2) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // --- THE SURGE ---
    // Find which vibe has the strongest recent activity (last 6 months)
    const recentMonths = readingData.filter(d => {
      const monthsAgo = (currentYear - d.year) * 12 + (currentMonth - d.month);
      return monthsAgo >= 0 && monthsAgo <= 6;
    });

    const insightVibes = VIBES.filter(v => v !== 'current');
    const recentVibeCounts: Record<VibeGroup, number> = { escapist: 0, ideas: 0, nature: 0, history: 0, life: 0, current: 0 };
    recentMonths.forEach(m => m.books.forEach(b => b.vibes.forEach(v => { recentVibeCounts[v]++; })));

    const surgeVibe = insightVibes.reduce((a, b) => recentVibeCounts[a] >= recentVibeCounts[b] ? a : b);
    const surgeCount = recentVibeCounts[surgeVibe];

    // Find previous peak for that vibe
    const olderMonths = readingData.filter(d => {
      const monthsAgo = (currentYear - d.year) * 12 + (currentMonth - d.month);
      return monthsAgo > 6;
    });
    let previousPeakYear = 0;
    let previousPeakCount = 0;
    const years = [...new Set(olderMonths.map(d => d.year))];
    years.forEach(yr => {
      const yrData = olderMonths.filter(d => d.year === yr);
      let count = 0;
      yrData.forEach(m => m.books.forEach(b => { if (b.vibes.includes(surgeVibe)) count++; }));
      if (count > previousPeakCount) { previousPeakCount = count; previousPeakYear = yr; }
    });

    const showSurge = surgeCount > 0 && previousPeakYear > 0;
    const surgeText = surgeCount > 0
      ? `You are currently in a heavy "${vibeLabels[surgeVibe]}" surge. ${previousPeakYear ? `This is your strongest interest since early ${previousPeakYear}.` : 'This is a new frontier for you!'}`
      : null;

    // --- THE DROUGHT ---
    // Find streams that have gone dry — no books at all in recent months
    // Only fire when there's a real drought worth mentioning
    const droughtThreshold = 6; // months with zero books to qualify
    let worstDrought: { vibe: VibeGroup; months: number } = { vibe: 'life', months: 0 };
    insightVibes.forEach(v => {
      let lastSeen = -1;
      readingData.forEach(d => {
        d.books.forEach(b => {
          if (b.vibes.includes(v)) {
            const mi = (d.year - 2020) * 12 + d.month;
            if (mi > lastSeen) lastSeen = mi;
          }
        });
      });
      const currentMi = (currentYear - 2020) * 12 + currentMonth;
      const drought = lastSeen >= 0 ? currentMi - lastSeen : 999;
      if (drought > worstDrought.months) {
        worstDrought = { vibe: v, months: drought };
      }
    });

    const showDrought = worstDrought.months >= droughtThreshold;
    const droughtText = worstDrought.months > 900
      ? `Your "${vibeLabels[worstDrought.vibe]}" stream has run completely dry — not a single book, ever. Time to explore?`
      : showDrought
        ? `Your "${vibeLabels[worstDrought.vibe]}" stream has been dry for ${worstDrought.months} months. That river bed is cracking.`
        : null;

    // --- THE FLOOD ---
    // Find the month with volume far above baseline
    const monthCounts = readingData.map(d => ({ year: d.year, month: d.month, count: d.books.length }));
    const avgCount = monthCounts.reduce((sum, m) => sum + m.count, 0) / monthCounts.length;
    const floodMonth = monthCounts.reduce((a, b) => b.count > a.count ? b : a);
    const floodRatio = avgCount > 0 ? floodMonth.count / avgCount : 0;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Find dominant vibe in that month
    const floodData = readingData.find(d => d.year === floodMonth.year && d.month === floodMonth.month);
    const floodVibeCounts: Record<VibeGroup, number> = { escapist: 0, ideas: 0, nature: 0, history: 0, life: 0, current: 0 };
    floodData?.books.forEach(b => b.vibes.forEach(v => { floodVibeCounts[v]++; }));
    const floodVibe = insightVibes.reduce((a, b) => floodVibeCounts[a] >= floodVibeCounts[b] ? a : b);

    const floodText = floodRatio >= 1.5
      ? `${monthNames[floodMonth.month]} ${floodMonth.year} was a flood — ${floodMonth.count} books, ${floodRatio.toFixed(1)}× your average of ${avgCount.toFixed(1)}/month. Mostly "${vibeLabels[floodVibe]}".`
      : `Your reading pace is remarkably steady. No major floods detected — you're a consistent reader!`;

    // --- THE SEASON ---
    // Find seasonal pattern: which quarter consistently has the highest volume
    const quarterNames = ['Winter (Jan–Mar)', 'Spring (Apr–Jun)', 'Summer (Jul–Sep)', 'Autumn (Oct–Dec)'];
    const quarterCounts = [0, 0, 0, 0];
    const quarterYears = [new Set<number>(), new Set<number>(), new Set<number>(), new Set<number>()];
    readingData.forEach(d => {
      const q = Math.floor(d.month / 3);
      const count = d.books.length;
      quarterCounts[q] += count;
      if (count > 0) quarterYears[q].add(d.year);
    });
    const quarterAvgs = quarterCounts.map((c, i) => quarterYears[i].size > 0 ? c / quarterYears[i].size : 0);
    const peakQ = quarterAvgs.reduce((best, val, i) => val > quarterAvgs[best] ? i : best, 0);
    const lowQ = quarterAvgs.reduce((best, val, i) => val < quarterAvgs[best] ? i : best, 0);
    const seasonRatio = quarterAvgs[lowQ] > 0 ? quarterAvgs[peakQ] / quarterAvgs[lowQ] : 0;

    const seasonText = seasonRatio >= 1.3
      ? `Your reading peaks in ${quarterNames[peakQ]} — ${quarterAvgs[peakQ].toFixed(1)} books/month vs ${quarterAvgs[lowQ].toFixed(1)} in ${quarterNames[lowQ]}.`
      : `No strong seasonal pattern — you read steadily year-round.`;

    return { surgeText, droughtText, showDrought, floodText, seasonText, surgeVibe, worstDrought, floodVibe, floodRatio, seasonRatio };
  }, [readingData]);

  if (!insights) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 px-4">
      <h2 className="text-lg font-serif font-bold text-foreground tracking-wide uppercase mb-4 text-center">
        Delta Insights
      </h2>
      <div className={`grid grid-cols-1 md:grid-cols-2 ${insights.showDrought ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        {/* The Surge */}
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: riverColors[insights.surgeVibe] }} />
            <h3 className="text-sm font-bold font-serif text-foreground uppercase tracking-wider">The Surge</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{insights.surgeText}</p>
        </div>

        {/* The Season */}
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: insights.seasonRatio >= 1.3 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
            <h3 className="text-sm font-bold font-serif text-foreground uppercase tracking-wider">The Season</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{insights.seasonText}</p>
        </div>

        {/* The Flood */}
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: insights.floodRatio >= 1.5 ? riverColors[insights.floodVibe] : 'hsl(var(--muted-foreground))' }} />
            <h3 className="text-sm font-bold font-serif text-foreground uppercase tracking-wider">The Flood</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{insights.floodText}</p>
        </div>

        {/* The Drought — only shown when a real drought exists */}
        {insights.showDrought && insights.droughtText && (
          <div className="bg-card/60 backdrop-blur-sm border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: riverColors[insights.worstDrought.vibe] }} />
              <h3 className="text-sm font-bold font-serif text-foreground uppercase tracking-wider">The Drought</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{insights.droughtText}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeltaInsights;
