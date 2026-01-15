import Link from 'next/link';

const footerLinks = {
  product: [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'FAQ', href: '/faq' },
    { label: 'For Parents', href: '/parent/register' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'More from us', href: '/deebop' },
  ],
  legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-dark-700 bg-dark-900">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Product */}
          <div>
            <h3 className="text-xs font-semibold text-white mb-3">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold text-white mb-3">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-white mb-3">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-dark-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-lg font-bold logo-shimmer">
            Deebop Chat
          </span>
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Deebop. Made with care for families.
          </p>
        </div>
      </div>
    </footer>
  );
}
