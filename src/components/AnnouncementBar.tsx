/**
 * @file AnnouncementBar.tsx
 * @description The $3/month price, shown openly before signup per the
 * product brief -- kept quiet rather than as a loud marketing banner.
 * Landing-page only (see app/page.tsx): a functional screen like login or
 * onboarding has no use for a pricing reminder mid-task.
 */

export default function AnnouncementBar() {
  return (
    <div className="bg-surface text-ink-secondary text-small text-center py-2.5 px-4 border-b border-line">
      Unlimited audio stories and a comment layer the family keeps using. $3 a month.
    </div>
  );
}
