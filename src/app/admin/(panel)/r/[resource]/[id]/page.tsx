import Link from 'next/link';
import { notFound } from 'next/navigation';
import ResourceForm from '@/components/admin/ResourceForm';
import Icon from '@/components/Icon';
import { buildFormProps } from '@/lib/admin/form-data';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditRecord({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  if (!UUID.test(id)) notFound();
  const props = await buildFormProps(resource, id);

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/admin/r/${props.resource.key}`} className="link inline-flex items-center text-[15px] font-medium">
          <Icon name="chevron-left" className="h-5 w-5" strokeWidth={2.2} />
          {props.resource.plural}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Tahrirlash: {props.resource.singular.toLowerCase()}</h1>
      </div>
      {/* key: boshqa yozuvga o'tilganda forma holati yangilanadi */}
      <ResourceForm key={id} {...props} />
    </div>
  );
}
