import React from 'react';
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Youtube, Send, Building2 } from 'lucide-react';
const Footer: React.FC = () => {
  const footerLinks = {
    company: [{
      name: 'Rólunk',
      href: '#'
    }, {
      name: 'Karrier',
      href: '#'
    }, {
      name: 'Sajtó',
      href: '#'
    }, {
      name: 'Blog',
      href: '#'
    }, {
      name: 'Partnerek',
      href: '#'
    }],
    support: [{
      name: 'Súgó',
      href: '#'
    }, {
      name: 'Biztonság',
      href: '#'
    }, {
      name: 'Lemondás',
      href: '#'
    }, {
      name: 'GYIK',
      href: '#'
    }, {
      name: 'Kapcsolat',
      href: '#'
    }],
    services: [{
      name: 'Szállások',
      href: '#hotels'
    }, {
      name: 'Úti célok',
      href: '#destinations'
    }, {
      name: 'Akciók',
      href: '#deals'
    }, {
      name: 'Foglalásaim',
      href: '#'
    }],
    legal: [{
      name: 'Adatvédelem',
      href: '#'
    }, {
      name: 'Felhasználási feltételek',
      href: '#'
    }, {
      name: 'Cookie szabályzat',
      href: '#'
    }, {
      name: 'Oldaltérkép',
      href: '#'
    }]
  };
  const socialLinks = [{
    icon: Facebook,
    href: '#',
    label: 'Facebook'
  }, {
    icon: Twitter,
    href: '#',
    label: 'Twitter'
  }, {
    icon: Instagram,
    href: '#',
    label: 'Instagram'
  }, {
    icon: Youtube,
    href: '#',
    label: 'Youtube'
  }];
  return <footer className="bg-slate-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold mb-2">Iratkozzon fel hírlevelünkre!</h3>
              <p className="text-white/60">Kapjon exkluzív ajánlatokat és utazási tippeket</p>
            </div>
            <div className="w-full lg:w-auto">
              <form className="flex flex-col sm:flex-row gap-3" onSubmit={e => e.preventDefault()}>
                <input type="email" placeholder="Az Ön email címe" className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-80" />
                <button type="submit" className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2">
                  <span>Feliratkozás</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Lanzaventura</span>
            </div>
            <p className="text-white/60 mb-6 max-w-xs">
              A legjobb szállásajánlatok egy helyen. Fedezze fel a világ legszebb helyeit velünk!
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-white/60">
                <MapPin className="w-5 h-5" />
                <span>Budapest, Magyarország</span>
              </div>
              <div className="flex items-center space-x-3 text-white/60">
                <Phone className="w-5 h-5" />
                <span>+36 1 234 5678</span>
              </div>
              <div className="flex items-center space-x-3 text-white/60">
                <Mail className="w-5 h-5" />
                <span>hello@lanzaventura.com</span>
              </div>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-lg mb-4">Cégünk</h4>
            <ul className="space-y-3">
              {footerLinks.company.map(link => <li key={link.name}>
                  <a href={link.href} className="text-white/60 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>)}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-lg mb-4">Támogatás</h4>
            <ul className="space-y-3">
              {footerLinks.support.map(link => <li key={link.name}>
                  <a href={link.href} className="text-white/60 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>)}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-lg mb-4">Szolgáltatások</h4>
            <ul className="space-y-3">
              {footerLinks.services.map(link => <li key={link.name}>
                  <a href={link.href} className="text-white/60 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>)}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-lg mb-4">Jogi információk</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map(link => <li key={link.name}>
                  <a href={link.href} className="text-white/60 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/60 text-sm text-center md:text-left">© 2026 Lanzaventura Vacation Club LLC. Minden jog fenntartva. </p>
            
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map(social => {
              const Icon = social.icon;
              return <a key={social.label} href={social.href} aria-label={social.label} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all">
                    <Icon className="w-5 h-5" />
                  </a>;
            })}
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;