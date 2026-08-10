import { CommandCenterWorkspace } from './components/CommandCenterWorkspace';

/** RC-20 Command Center operations workspace page (Epic 1 foundation). */
export function CommandCenterPage() {
  return (
    <section data-testid="command-center-page">
      <CommandCenterWorkspace />
    </section>
  );
}
