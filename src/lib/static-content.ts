// Mobile-native versions of the user-frontend static content pages. These
// mirror the key copy from the web pages (about/careers/contact/help/press/
// returns/shipping/size-guide/sustainability) so the mobile app can render
// the same information without a WebView.

export interface ContentSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  items?: Array<{ label: string; value: string; note?: string }>;
  faq?: Array<{ q: string; a: string }>;
  callout?: { title: string; body: string };
}

export interface StaticContent {
  title: string;
  intro: string;
  sections: ContentSection[];
}

export const CONTACT = {
  email: 'support@martinonoir.com',
  phone: '0803 801 0651',
  phoneTel: '+2348038010651',
  hoursMonFri: '9:00 am – 6:00 pm WAT',
  hoursSat: '10:00 am – 4:00 pm WAT',
  hoursSun: 'Closed',
  addressCity: 'Lagos, Nigeria',
};

export const STATIC_CONTENT: Record<string, StaticContent> = {
  about: {
    title: 'About Martinonoir',
    intro:
      'Martinonoir was born from a single belief: that truly great things are made slowly, with intention, by people who care deeply about their work.',
    sections: [
      {
        heading: 'Our Mission',
        paragraphs: [
          'We believe luxury should never come at someone else\u2019s expense. From the ranches where our hides are sourced to the workshops where our bags are assembled, every decision is made with care. We don\u2019t chase trends. We build heirlooms.',
        ],
      },
      {
        heading: 'What We Stand For',
        items: [
          {
            label: 'Uncompromising Quality',
            value:
              'Every stitch, every cut, every finish is reviewed against the highest standard. We reject anything that doesn\u2019t meet the Martinonoir benchmark.',
          },
          {
            label: 'Responsible Sourcing',
            value:
              'Our leather comes exclusively from certified tanneries that meet international animal welfare and environmental standards.',
          },
          {
            label: 'Artisan Partnership',
            value:
              'We work directly with master craftspeople across West Africa and Italy, paying fair wages and preserving generational techniques.',
          },
          {
            label: 'Crafted with Intention',
            value:
              'Each product is designed to be worn daily for years \u2014 not seasons. Timelessness is the ultimate luxury.',
          },
        ],
      },
      {
        heading: 'Our Milestones',
        items: [
          { label: '2018', value: 'Founded in Lagos by Martins Nwude with a single leather bag design.' },
          { label: '2019', value: 'First collection sold out in 72 hours. Workshop expanded to 12 artisans.' },
          { label: '2021', value: 'Launched clothing line. Opened flagship showroom in Onitsha.' },
          { label: '2023', value: 'Introduced international shipping to 7+ countries.' },
          { label: '2024', value: 'Reached 50,000 customers across Africa, Europe, and North America.' },
          { label: '2025', value: 'Launched Martinonoir digital storefront and unified commerce platform.' },
        ],
      },
    ],
  },

  careers: {
    title: 'Careers at Martinonoir',
    intro:
      'Build your career with a team that believes in craft, honesty, and caring deeply about the work. We hire for curiosity, rigor, and humility.',
    sections: [
      {
        heading: 'Why work with us',
        bullets: [
          'Fair wages benchmarked to the top of the market in every region we operate in.',
          'Mentorship from master artisans with decades of experience.',
          'Real ownership \u2014 your work ships to customers in weeks, not quarters.',
          'Health cover for you and your immediate family.',
          'Generous paid leave and flexible schedules where the work allows it.',
        ],
      },
      {
        heading: 'Current openings',
        paragraphs: [
          'We post roles as they open. To be considered for future positions, send a short note about yourself and your work to mail@martinonoir.com.',
        ],
      },
      {
        callout: {
          title: 'Apprenticeships',
          body: 'Every year we take on a small cohort of apprentices trained in leather craft, pattern-making, and finishing. Applications open in January.',
        },
      },
    ],
  },

  contact: {
    title: 'Contact Us',
    intro:
      'Have a question, concern, or just want to say hello? Our team is ready to assist you every step of the way.',
    sections: [
      {
        heading: 'Ways to reach us',
        items: [
          { label: 'Email', value: CONTACT.email, note: 'We reply within 24 hours on business days.' },
          { label: 'Phone', value: CONTACT.phone, note: `Available Monday \u2013 Friday, ${CONTACT.hoursMonFri}.` },
          { label: 'Visit', value: CONTACT.addressCity, note: 'Our store is open Monday through Saturday.' },
        ],
      },
      {
        heading: 'Business hours',
        items: [
          { label: 'Mon \u2013 Fri', value: CONTACT.hoursMonFri },
          { label: 'Saturday', value: CONTACT.hoursSat },
          { label: 'Sunday', value: CONTACT.hoursSun },
        ],
      },
      {
        heading: 'Frequently Asked',
        faq: [
          {
            q: 'How long does shipping take?',
            a: 'Standard delivery within Lagos takes 1\u20132 business days. Other states typically take 3\u20135 business days. International orders ship within 7\u201314 business days.',
          },
          {
            q: 'What is your return policy?',
            a: 'We accept returns within 30 days of delivery for unworn, undamaged items in original packaging. Refunds are processed within 5\u20137 business days of receiving your return.',
          },
          {
            q: 'Are your leather products authentic?',
            a: 'Every Martinonoir piece is crafted from genuine premium leather sourced from certified tanneries. Each product ships with a certificate of authenticity.',
          },
          {
            q: 'Which payment methods do you accept?',
            a: 'We accept Paystack, Moniepoint, Stripe, Visa, and Mastercard. All transactions are encrypted and fully secured.',
          },
        ],
      },
    ],
  },

  help: {
    title: 'Help Center',
    intro:
      'Answers to common questions about orders, shipping, returns, and your account. If you don\u2019t find what you\u2019re looking for, our team is one tap away.',
    sections: [
      {
        heading: 'Orders & Payment',
        faq: [
          {
            q: 'How do I place an order?',
            a: 'Browse the catalog, tap a product, pick your variant, and add it to your bag. When you\u2019re ready, open your bag and proceed to checkout.',
          },
          {
            q: 'Can I modify an order after placing it?',
            a: 'We prepare orders quickly. If you need a change, contact support within 1 hour of placing the order and we\u2019ll do our best.',
          },
          {
            q: 'Which payment methods are accepted?',
            a: 'Paystack, Moniepoint, Stripe, and all major cards (Visa, Mastercard). All transactions are encrypted.',
          },
        ],
      },
      {
        heading: 'Shipping & Delivery',
        faq: [
          {
            q: 'How long does delivery take?',
            a: 'Lagos: 1\u20132 business days. Other Nigerian states: 3\u20135 business days. International: 7\u201314 business days.',
          },
          {
            q: 'Do you ship internationally?',
            a: 'Yes. We currently ship to 7+ countries across Africa, Europe, and North America.',
          },
          {
            q: 'How do I track my order?',
            a: 'Open the app, go to Account > Track Order, and enter your order number or tracking number.',
          },
        ],
      },
      {
        heading: 'Returns & Exchanges',
        faq: [
          {
            q: 'What is your return window?',
            a: 'Returns are accepted within 30 days of delivery for unworn, undamaged items in original packaging.',
          },
          {
            q: 'How are refunds processed?',
            a: 'Refunds are issued to your original payment method within 5\u20137 business days of us receiving your return.',
          },
        ],
      },
      {
        heading: 'Account',
        faq: [
          {
            q: 'How do I reset my password?',
            a: 'On the sign-in screen, tap Forgot password and enter your email. We\u2019ll send a reset link.',
          },
          {
            q: 'How do I verify my email?',
            a: 'Open the verification email we sent you and tap the link. You can resend it from Account > Verify your email.',
          },
        ],
      },
    ],
  },

  press: {
    title: 'Press & Media',
    intro:
      'Welcome to the Martinonoir press room. For interviews, images, and brand materials, reach out to our team.',
    sections: [
      {
        heading: 'Media inquiries',
        paragraphs: [
          `Email mail@martinonoir.com. We respond within 24 hours on business days.`,
        ],
      },
      {
        heading: 'Brand assets',
        bullets: [
          'High-resolution logo (light + dark)',
          'Product photography (hero + detail)',
          'Founder portrait and bio',
          'Brand style guide and typography',
        ],
      },
      {
        callout: {
          title: 'In the news',
          body: 'Selected coverage is curated on martinonoir.com/press. Get in touch for the full media kit.',
        },
      },
    ],
  },

  returns: {
    title: 'Returns & Exchanges',
    intro:
      'We stand behind every piece we make. If something isn\u2019t right, we\u2019ll help you sort it out.',
    sections: [
      {
        heading: 'Return window',
        paragraphs: [
          'You have 30 days from the date of delivery to initiate a return. Items must be unworn, undamaged, and in their original packaging with all tags attached.',
        ],
      },
      {
        heading: 'How to start a return',
        bullets: [
          'Email support@martinonoir.com with your order number and a brief note.',
          'We\u2019ll send you a return shipping label and instructions.',
          'Pack the item securely in its original packaging.',
          'Drop it off at the specified courier within 7 days.',
        ],
      },
      {
        heading: 'Refunds',
        paragraphs: [
          'Once we receive and inspect your return, we\u2019ll issue a refund to your original payment method within 5\u20137 business days. You\u2019ll get an email confirmation when the refund is processed.',
        ],
      },
      {
        heading: 'Exchanges',
        paragraphs: [
          'Exchanges follow the same process as returns. Request your preferred size, color, or variant in your return email and we\u2019ll ship it as soon as the original item is received and inspected.',
        ],
      },
      {
        heading: 'Non-returnable items',
        bullets: [
          'Personalized or monogrammed items',
          'Items marked as Final Sale',
          'Intimates and accessories for hygiene reasons',
        ],
      },
    ],
  },

  shipping: {
    title: 'Shipping & Delivery',
    intro:
      'Fast, tracked shipping on every order. Local and international.',
    sections: [
      {
        heading: 'Delivery times',
        items: [
          { label: 'Lagos', value: '1\u20132 business days' },
          { label: 'Other Nigerian states', value: '3\u20135 business days' },
          { label: 'West Africa', value: '4\u20137 business days' },
          { label: 'International', value: '7\u201314 business days' },
        ],
      },
      {
        heading: 'Shipping rates',
        paragraphs: [
          'Shipping is calculated at checkout based on your destination and the weight of your order. Free standard shipping on Nigerian orders over \u20a6200,000.',
        ],
      },
      {
        heading: 'Tracking',
        paragraphs: [
          'A tracking number is emailed to you the moment your order ships. You can also track it in the app under Account > Track Order.',
        ],
      },
      {
        heading: 'Customs & duties',
        paragraphs: [
          'International customers are responsible for any customs duties and import taxes levied by their country. These are not included in the shipping rate.',
        ],
      },
    ],
  },

  'size-guide': {
    title: 'Size Guide',
    intro: 'Find the perfect fit. All measurements are in centimeters unless otherwise noted.',
    sections: [
      {
        heading: 'Bags \u2014 dimensions',
        items: [
          { label: 'Mini', value: '18 \u00d7 13 \u00d7 7 cm', note: 'Phone, cards, small essentials.' },
          { label: 'Small', value: '24 \u00d7 17 \u00d7 9 cm', note: 'Phone, wallet, keys, compact makeup.' },
          { label: 'Medium', value: '30 \u00d7 22 \u00d7 12 cm', note: 'Everyday carry. Tablet fits.' },
          { label: 'Large', value: '38 \u00d7 28 \u00d7 15 cm', note: 'Laptop (up to 14"), folder, and essentials.' },
        ],
      },
      {
        heading: 'Clothing \u2014 women',
        items: [
          { label: 'XS', value: 'Bust 80 \u00b7 Waist 62 \u00b7 Hip 88' },
          { label: 'S', value: 'Bust 84 \u00b7 Waist 66 \u00b7 Hip 92' },
          { label: 'M', value: 'Bust 88 \u00b7 Waist 70 \u00b7 Hip 96' },
          { label: 'L', value: 'Bust 94 \u00b7 Waist 76 \u00b7 Hip 102' },
          { label: 'XL', value: 'Bust 100 \u00b7 Waist 82 \u00b7 Hip 108' },
        ],
      },
      {
        heading: 'Clothing \u2014 men',
        items: [
          { label: 'S', value: 'Chest 92 \u00b7 Waist 78 \u00b7 Hip 94' },
          { label: 'M', value: 'Chest 98 \u00b7 Waist 84 \u00b7 Hip 100' },
          { label: 'L', value: 'Chest 104 \u00b7 Waist 90 \u00b7 Hip 106' },
          { label: 'XL', value: 'Chest 110 \u00b7 Waist 96 \u00b7 Hip 112' },
          { label: 'XXL', value: 'Chest 116 \u00b7 Waist 102 \u00b7 Hip 118' },
        ],
      },
      {
        heading: 'How to measure',
        bullets: [
          'Bust/Chest: measure around the fullest point, keeping the tape horizontal.',
          'Waist: measure around your natural waistline, above the belly button.',
          'Hip: measure around the fullest point of your hips.',
          'Keep the tape snug but not tight. Measure over thin clothing for best results.',
        ],
      },
    ],
  },

  sustainability: {
    title: 'Sustainability',
    intro:
      'We build for the long run. Every choice we make, from raw materials to packaging, is evaluated for its impact on people and the planet.',
    sections: [
      {
        heading: 'Materials',
        paragraphs: [
          'We use full-grain leather from certified tanneries that meet the Leather Working Group\u2019s environmental standards. Our textile partners are Oeko-Tex certified and audited annually.',
        ],
      },
      {
        heading: 'Production',
        bullets: [
          'Small batches, made-to-order where possible, to minimize overproduction.',
          'Workshops powered by a growing share of renewable energy \u2014 target 80% by 2027.',
          'Water-based finishes replacing solvent-based ones across our leather lines.',
          'Zero landfill waste at our flagship Lagos workshop since 2023.',
        ],
      },
      {
        heading: 'People',
        paragraphs: [
          'Every person who makes a Martinonoir product is paid a living wage, benchmarked above the local market. We publish a wage transparency report each year.',
        ],
      },
      {
        heading: 'Packaging',
        paragraphs: [
          'All shipping boxes are made from 100% recycled cardboard and are fully recyclable. Our dust bags use organic cotton and are designed to be reused for storage.',
        ],
      },
      {
        callout: {
          title: 'Our 2027 commitments',
          body: '80% renewable energy across all workshops \u00b7 50% reduction in water use per unit \u00b7 100% traceable leather supply chain.',
        },
      },
    ],
  },
};

export const STATIC_SLUGS = Object.keys(STATIC_CONTENT);
