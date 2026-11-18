import { Banknote, BarChart3, BatteryCharging, Sun } from 'lucide-react';
import { translations, type Lang } from '../i18n/translations';

interface MobileBottomNavProps {
  lang: Lang;
}

export function MobileBottomNav({ lang }: MobileBottomNavProps) {
  const t = translations[lang];

  const items = [
    { href: '#section-overview', label: t.navOverview, icon: Sun, color: 'text-amber-400' },
    { href: '#section-cost', label: t.navCost, icon: Banknote, color: 'text-teal-400' },
    { href: '#section-charts', label: t.navCharts, icon: BarChart3, color: 'text-sky-400' },
    { href: '#section-battery', label: t.navBattery, icon: BatteryCharging, color: 'text-emerald-400' },
  ];

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-md pb-safe md:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium text-slate-300 transition active:scale-95 active:bg-slate-800/60"
            >
              <Icon className={`h-4.5 w-4.5 ${item.color}`} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
