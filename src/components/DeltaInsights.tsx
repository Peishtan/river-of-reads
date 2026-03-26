import { useMemo } from 'react';
import { MonthData, VibeGroup, vibeLabels, VIBES } from '@/data/readingData';
import { useReadingData } from '@/contexts/ReadingDataContext';

const DeltaInsights = () => {
  const { data: readingData, riverColors } = useReadingData();

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

    const recentVibeCounts: Record<VibeGroup, number> = { escapist: 0, ideas: 0, nature: 0, history: 0, life: 0, current: 0 };
    recentMonths.forEach(m => m.books.forEach(b => b.vibes.forEach(v => { recentVibeCounts[v]++; })));

    const surgeVibe = VIBES.reduce((a, b) => recentVibeCounts[a] >= recentVibeCounts[b] ? a : b);
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

    const surgeText = surgeCount > 0
      ? `You are currently in a heavy "${vibeLabels[surgeVibe]}" surge. ${previousPeakYear ? `This is your strongest interest since early ${previousPeakYear}.` : 'This is a new frontier for you!'}`
      : `Your reading has been quiet recently. Time to dive back in!`;

    // --- THE DROUGHT ---
    // Find which vibe hasn't seen a 5-star book in the longest time
    let worstDrought: { vibe: VibeGroup; months: number } = { vibe: 'life', months: 0 };
    VIBES.forEach(v => {
      let lastFiveStar = -1;
      readingData.forEach(d => {
        d.books.forEach(b => {
          if (b.vibes.includes(v) && b.rating === 5) {
            const mi = (d.year - 2020) * 12 + d.month;
            if (mi > lastFiveStar) lastFiveStar = mi;
          }
        });
      });
      const currentMi = (currentYear - 2020) * 12 + currentMonth;
      const drought = lastFiveStar >= 0 ? currentMi - lastFiveStar : 999;
      if (drought > worstDrought.months) {
        worstDrought = { vibe: v, months: drought };
      }
    });

    const droughtText = worstDrought.months > 900
      ? `Your "${vibeLabels[worstDrought.vibe]}" stream has never seen a 5-star book. Time to find a classic!`
      : worstDrought.months > 3
        ? `Your "${vibeLabels[worstDrought.vibe]}" stream hasn't seen a 5-star book in ${worstDrought.months} months. Time for a high-rated classic?`
        : `All your streams are flowing with great books recently!`;

    // --- DIVERSITY SCORE ---
    const allYears = [...new Set(readingData.map(d => d.year))].sort();
    const firstYear = allYears[0];
    const lastYear = allYears[allYears.length - 1];

    const vibeSpread = (yr: number) => {
      const yrData = readingData.filter(d => d.year === yr);
      const counts: Record<VibeGroup, number> = { escapist: 0, ideas: 0, nature: 0, history: 0, life: 0, current: 0 };
      yrData.forEach(m => m.books.forEach(b => b.vibes.forEach(v => { counts[v]++; })));
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      if (total === 0) return 0;
      // Shannon entropy normalized
      let entropy = 0;
      VIBES.forEach(v => {
        const p = counts[v] / total;
        if (p > 0) entropy -= p * Math.log2(p);
      });
      return entropy / Math.log2(5); // normalize to 0-1
    };

    const firstSpread = vibeSpread(firstYear);
    const lastSpread = vibeSpread(lastYear);
    const spreadDiff = firstSpread > 0 ? Math.round(((lastSpread - firstSpread) / firstSpread) * 100) : 0;

    const diversityText = spreadDiff > 10
      ? `Your ${lastYear} Delta is ${spreadDiff}% wider than your ${firstYear} Source. Your tastes are expanding!`
      : spreadDiff < -10
        ? `Your ${lastYear} Delta is ${Math.abs(spreadDiff)}% narrower than ${firstYear}. You're becoming more focused!`
        : `Your reading diversity has stayed consistent from ${firstYear} to ${lastYear}. A balanced reader!`;

    return { surgeText, droughtText, diversityText, surgeVibe, worstDrought };
  }, [readingData]);

  if (!insights) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 px-4">
      <h2 className="text-lg font-serif font-bold text-foreground tracking-wide uppercase mb-4 text-center">
        Delta Insights
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* The Surge */}
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: riverColors[insights.surgeVibe] }} />
            <h3 className="text-sm font-bold font-serif text-foreground uppercase tracking-wider">The Surge</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{insights.surgeText}</p>
        </div>

        {/* The Drought */}
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: riverColors[insights.worstDrought.vibe] }} />
            <h3 className="text-sm font-bold font-serif text-foreground uppercase tracking-wider">The Drought</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{insights.droughtText}</p>
        </div>

        {/* Diversity Score */}
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex -space-x-0.5">
              {VIBES.slice(0, 3).map(v => (
                <span key={v} className="w-2 h-2 rounded-full" style={{ backgroundColor: riverColors[v] }} />
              ))}
            </div>
            <h3 className="text-sm font-bold font-serif text-foreground uppercase tracking-wider">Diversity Score</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{insights.diversityText}</p>
        </div>
      </div>
    </div>
  );
};

export default DeltaInsights;
