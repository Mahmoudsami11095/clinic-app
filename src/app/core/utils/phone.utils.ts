export function splitPhoneNumber(contactNumber: string | null | undefined): { countryCode: string; phoneNumber: string } {
  if (!contactNumber) return { countryCode: '+20', phoneNumber: '' };
  
  contactNumber = contactNumber.trim();
  
  if (contactNumber.startsWith('+')) {
    const prefixes = [
      '+966', '+971', '+380', '+359', '+249', '+212', '+213', '+216', '+218', 
      '+20', '+44', '+49', '+33', '+91', '+86', '+1'
    ];
    
    for (const prefix of prefixes) {
      if (contactNumber.startsWith(prefix)) {
        return { 
          countryCode: prefix, 
          phoneNumber: contactNumber.substring(prefix.length).trim() 
        };
      }
    }
    
    // Fallback if it has a plus but no known prefix
    if (contactNumber.length >= 4) {
      return { 
        countryCode: contactNumber.substring(0, 4), 
        phoneNumber: contactNumber.substring(4).trim() 
      };
    }
  }
  
  return { countryCode: '+20', phoneNumber: contactNumber };
}

export function combinePhoneNumber(countryCode: string | null | undefined, phoneNumber: string | null | undefined): string {
  const code = countryCode || '+20';
  const num = phoneNumber || '';
  return `${code}${num}`.trim();
}
