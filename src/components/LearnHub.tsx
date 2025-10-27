import { BookOpen, ExternalLink, FileText, Calculator, Shield, MessageCircle } from 'lucide-react';

export const LearnHub = () => {
  const guides = [
    {
      icon: FileText,
      title: 'How to Register for SARS eFiling',
      description: 'Step-by-step guide to registering for your SARS eFiling profile',
      points: [
        'Visit www.sarsefiling.co.za and click Register',
        'Have your ID number and tax reference number ready',
        'Complete the registration form with personal details',
        'Set up your password and security questions',
        'Verify your email address',
        'Log in and complete your taxpayer profile'
      ],
      link: 'https://www.sarsefiling.co.za'
    },
    {
      icon: Calculator,
      title: 'Understanding Provisional Tax',
      description: 'What provisional tax is and when you need to register',
      points: [
        'Required if you earn more than R30,000 from non-PAYE sources',
        'Pay estimated tax in two installments (August and February)',
        'Based on your estimated annual taxable income',
        'Avoid penalties by paying on time',
        'Register within 60 days of becoming liable',
        'Use IRP6 form to declare and pay'
      ]
    },
    {
      icon: Shield,
      title: 'VAT Registration Guide',
      description: 'When and how to register for VAT',
      points: [
        'Mandatory if turnover exceeds R1 million in 12 months',
        'Voluntary registration available for lower turnover',
        'Register on SARS eFiling or at SARS branch',
        'Submit VAT returns every 2 months',
        'Charge 15% VAT on taxable supplies',
        'Claim input VAT on business purchases',
        'Keep detailed records for 5 years'
      ]
    },
    {
      icon: BookOpen,
      title: 'Claiming Home Office Expenses',
      description: 'How to claim deductions for working from home',
      points: [
        'Limited to 50% of home-related costs',
        'Calculate based on floor area used exclusively for business',
        'Claimable expenses: rent/bond interest, rates, electricity, water',
        'Keep receipts and proof of payment',
        'Not available if you have access to employer office',
        'Must be used regularly and exclusively for work'
      ]
    },
    {
      icon: Calculator,
      title: 'Allowable Deductions for Creators',
      description: 'What expenses you can claim to reduce taxable income',
      points: [
        'Equipment: cameras, computers, software (wear and tear)',
        'Data and airtime directly related to business',
        'Marketing and advertising costs',
        'Professional services (accountants, legal)',
        'Travel expenses (with log book)',
        'Bank charges on business account',
        'Training and skills development',
        'Insurance related to business'
      ]
    },
    {
      icon: Shield,
      title: 'Tax Compliance Checklist',
      description: 'Stay compliant with SARS requirements',
      points: [
        'Register for tax once income exceeds R95,750',
        'File annual tax return by deadline (usually October)',
        'Pay provisional tax by August 31 and February 28',
        'Keep all receipts and records for 5 years',
        'Declare all income including cash and barter',
        'Update SARS with address or banking changes',
        'Respond to SARS queries within 21 days'
      ]
    }
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Learn & Grow Hub</h1>
        <p className="text-gray-600 mt-1">SARS compliance guides for South African creators</p>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
            <MessageCircle size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">MyGig-Economy AI Assistant</h2>
            <p className="text-purple-100">Get instant answers to your tax and business questions</p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
          <p className="text-sm mb-3">
            Our AI-powered chat assistant is here to help you with:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-purple-200">•</span>
              <span>Tax questions and SARS compliance guidance</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-200">•</span>
              <span>Understanding deductions and FMV calculations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-200">•</span>
              <span>Navigating the MyGig-Economy platform</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-200">•</span>
              <span>Business advice for South African creators</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs text-purple-100">
              💬 <strong>Look for the chat widget</strong> at the bottom right of your screen to start a conversation!
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
            <BookOpen size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Tax Education Center</h2>
            <p className="text-blue-100">Everything you need to know about SARS compliance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {guides.map((guide, idx) => {
          const Icon = guide.icon;
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                  <Icon size={24} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{guide.title}</h3>
                  <p className="text-sm text-gray-600">{guide.description}</p>
                </div>
              </div>

              <ul className="space-y-2 mb-4">
                {guide.points.map((point, pidx) => (
                  <li key={pidx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              {guide.link && (
                <a
                  href={guide.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Visit SARS eFiling
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Important SARS Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="https://www.sarsefiling.co.za"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-yellow-300 hover:border-yellow-400 transition-colors"
          >
            <ExternalLink size={20} className="text-yellow-600" />
            <div>
              <p className="font-medium text-gray-900">SARS eFiling Portal</p>
              <p className="text-sm text-gray-600">Online tax services</p>
            </div>
          </a>

          <a
            href="https://www.sars.gov.za"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-yellow-300 hover:border-yellow-400 transition-colors"
          >
            <ExternalLink size={20} className="text-yellow-600" />
            <div>
              <p className="font-medium text-gray-900">SARS Website</p>
              <p className="text-sm text-gray-600">Main tax authority site</p>
            </div>
          </a>

          <a
            href="https://www.sars.gov.za/contact/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-yellow-300 hover:border-yellow-400 transition-colors"
          >
            <ExternalLink size={20} className="text-yellow-600" />
            <div>
              <p className="font-medium text-gray-900">SARS Contact Center</p>
              <p className="text-sm text-gray-600">0800 00 7277</p>
            </div>
          </a>

          <a
            href="https://www.sars.gov.za/tax-rates/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-yellow-300 hover:border-yellow-400 transition-colors"
          >
            <ExternalLink size={20} className="text-yellow-600" />
            <div>
              <p className="font-medium text-gray-900">Tax Rates & Tables</p>
              <p className="text-sm text-gray-600">Current year rates</p>
            </div>
          </a>
        </div>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Need Professional Help?</h3>
        <p className="text-gray-700 mb-4">
          While MyGig-Economy helps you track and understand your tax obligations, complex situations may require professional assistance. Consider consulting with:
        </p>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Registered Tax Practitioners - for tax planning and compliance</li>
          <li>• Chartered Accountants (CA) - for comprehensive financial advice</li>
          <li>• SARS Tax Clinics - free assistance for qualifying individuals</li>
        </ul>
      </div>
    </div>
  );
};
