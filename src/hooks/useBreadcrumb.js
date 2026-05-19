import { useStore } from '../store/useStore';

export function useBreadcrumb() {
  const breadcrumb = useStore(s => s.breadcrumb);
  const nodes = useStore(s => s.nodes);

  const breadcrumbNodes = breadcrumb
    .map(id => nodes.find(n => n.id === id))
    .filter(Boolean);

  return { breadcrumb, breadcrumbNodes };
}
