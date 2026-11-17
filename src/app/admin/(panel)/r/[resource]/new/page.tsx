import Link from 'next/link';
import ResourceForm from '@/components/admin/ResourceForm';
import Icon from '@/components/Icon';
import { buildFormProps } from '@/lib/admin/form-data';

export default async function NewRecord({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const props = await buildFormProps(resource, null);

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/admin/r/${props.resource.key}`} className="link inline-flex items-center text-[15px] font-medium">
          <Icon name="chevron-left" className="h-5 w-5" strokeWidth={2.2} />
          {props.resource.plural}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Yangi: {props.resource.singular.toLowerCase()}</h1>
      </div>
      <ResourceForm {...props} />
    </div>
  );
}
