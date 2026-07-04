import type { Schema, Struct } from '@strapi/strapi';

export interface SectionsAnnouncement extends Struct.ComponentSchema {
  collectionName: 'components_sections_announcements';
  info: {
    displayName: 'Announcement';
  };
  attributes: {
    curator: Schema.Attribute.String;
    exhibitionEnd: Schema.Attribute.Date;
    exhibitionName: Schema.Attribute.String & Schema.Attribute.Required;
    exhibitionStart: Schema.Attribute.Date;
    image: Schema.Attribute.Media<'images'>;
    link: Schema.Attribute.Component<'shared.link', false>;
    venue: Schema.Attribute.String;
    vernissageDate: Schema.Attribute.DateTime;
  };
}

export interface SectionsGallerySection extends Struct.ComponentSchema {
  collectionName: 'components_sections_gallery_sections';
  info: {
    displayName: 'Gallery Section';
    icon: 'images';
  };
  attributes: {
    paintings: Schema.Attribute.Relation<'oneToMany', 'api::painting.painting'>;
    title: Schema.Attribute.String;
  };
}

export interface SectionsHero extends Struct.ComponentSchema {
  collectionName: 'components_sections_heroes';
  info: {
    displayName: 'Hero';
  };
  attributes: {
    heading: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    subheading: Schema.Attribute.String;
  };
}

export interface SectionsTextBlock extends Struct.ComponentSchema {
  collectionName: 'components_sections_text_blocks';
  info: {
    displayName: 'Text Block';
  };
  attributes: {
    body: Schema.Attribute.RichText;
    heading: Schema.Attribute.String;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    displayName: 'Link';
    icon: 'link';
  };
  attributes: {
    newTab: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    text: Schema.Attribute.String;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
    structuredData: Schema.Attribute.JSON;
  };
}

export interface UiButton extends Struct.ComponentSchema {
  collectionName: 'components_ui_buttons';
  info: {
    displayName: 'button';
  };
  attributes: {
    title: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'sections.announcement': SectionsAnnouncement;
      'sections.gallery-section': SectionsGallerySection;
      'sections.hero': SectionsHero;
      'sections.text-block': SectionsTextBlock;
      'shared.link': SharedLink;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'ui.button': UiButton;
    }
  }
}
