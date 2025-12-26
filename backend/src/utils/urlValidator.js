function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  // Check for disallowed schemes
  if (trimmedUrl.startsWith('file://')) {
    return { valid: false, error: 'file:// URLs are not allowed' };
  }

  if (trimmedUrl.startsWith('javascript:')) {
    return { valid: false, error: 'javascript: URLs are not allowed' };
  }

  if (trimmedUrl.startsWith('data:')) {
    return { valid: false, error: 'data: URLs are not allowed' };
  }

  // Validate URL format
  try {
    const parsed = new URL(trimmedUrl);
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: `Invalid protocol: ${parsed.protocol}. Only http:// and https:// are allowed` };
    }

    return { valid: true, url: parsed.href };
  } catch (error) {
    // Try adding https:// if no protocol
    if (!trimmedUrl.includes('://')) {
      try {
        const withHttps = new URL('https://' + trimmedUrl);
        return { valid: true, url: withHttps.href };
      } catch {
        return { valid: false, error: 'Invalid URL format' };
      }
    }
    return { valid: false, error: 'Invalid URL format' };
  }
}

module.exports = { validateUrl };
