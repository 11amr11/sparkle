import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Country {
    code: string;
    name: string;
    flag: string;
    dial_code: string;
}

const countries: Country[] = [
    { code: 'EG', name: 'Egypt', flag: '🇪🇬', dial_code: '+20' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dial_code: '+966' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dial_code: '+971' },
    { code: 'US', name: 'United States', flag: '🇺🇸', dial_code: '+1' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dial_code: '+44' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', dial_code: '+49' },
    { code: 'FR', name: 'France', flag: '🇫🇷', dial_code: '+33' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', dial_code: '+39' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', dial_code: '+34' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷', dial_code: '+90' },
    { code: 'IQ', name: 'Iraq', flag: '🇮🇶', dial_code: '+964' },
    { code: 'SY', name: 'Syria', flag: '🇸🇾', dial_code: '+963' },
    { code: 'JO', name: 'Jordan', flag: '🇯🇴', dial_code: '+962' },
    { code: 'LB', name: 'Lebanon', flag: '🇱🇧', dial_code: '+961' },
    { code: 'PS', name: 'Palestine', flag: '🇵🇸', dial_code: '+970' },
    { code: 'KW', name: 'Kuwait', flag: '🇰🇼', dial_code: '+965' },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦', dial_code: '+974' },
    { code: 'BH', name: 'Bahrain', flag: '🇧🇭', dial_code: '+973' },
    { code: 'OM', name: 'Oman', flag: '🇴🇲', dial_code: '+968' },
    { code: 'YE', name: 'Yemen', flag: '🇾🇪', dial_code: '+967' },
    { code: 'MA', name: 'Morocco', flag: '🇲🇦', dial_code: '+212' },
    { code: 'DZ', name: 'Algeria', flag: '🇩🇿', dial_code: '+213' },
    { code: 'TN', name: 'Tunisia', flag: '🇹🇳', dial_code: '+216' },
    { code: 'LY', name: 'Libya', flag: '🇱🇾', dial_code: '+218' },
    { code: 'SD', name: 'Sudan', flag: '🇸🇩', dial_code: '+249' },
    { code: 'IN', name: 'India', flag: '🇮🇳', dial_code: '+91' },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dial_code: '+92' },
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dial_code: '+880' },
];

interface CountrySelectProps {
    value: string;
    onChange: (dialCode: string) => void;
}

export const CountrySelect = ({ value, onChange }: CountrySelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedCountry = countries.find(c => c.dial_code === value) || countries[0];

    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(search.toLowerCase()) ||
        country.dial_code.includes(search) ||
        country.code.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-3 rounded-2xl border-none bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
                <span className="text-2xl">{selectedCountry.flag}</span>
                <span className="font-medium">{selectedCountry.dial_code}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 max-h-96 overflow-hidden">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search country..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border-none bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto max-h-80">
                        {filteredCountries.map((country) => (
                            <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                    onChange(country.dial_code);
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                            >
                                <span className="text-2xl">{country.flag}</span>
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900 dark:text-white">{country.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{country.code}</p>
                                </div>
                                <span className="font-medium text-primary">{country.dial_code}</span>
                            </button>
                        ))}
                        {filteredCountries.length === 0 && (
                            <p className="text-center py-4 text-slate-500">No countries found</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
