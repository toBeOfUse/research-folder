import { Entity, Fields } from 'remult';

@Entity('papers', {
    allowApiCrud: true,
})

export class Paper {
    @Fields.uuid()
    id!: string;

    @Fields.string()
    title = '';

    @Fields.object()
    authors: string[] = [];

    @Fields.object()
    tags: string[] = [];

    @Fields.string()
    notes = "";

    @Fields.dateOnly()
    published = new Date(1970);
}
