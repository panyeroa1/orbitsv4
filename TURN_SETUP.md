# TURN Server Setup Guide

## Why TURN Servers?

STUN servers help with NAT traversal but fail for ~10-20% of users behind:
- Symmetric NATs
- Corporate firewalls
- Restrictive networks

TURN servers act as relay servers, ensuring **95%+ connection success rate**.

## Option 1: Metered (Free Tier Recommended)

**Cost:** FREE up to 50GB/month, then $0.20/GB
**Setup:** Already configured! No credentials needed for OpenRelay.

The following TURN servers are already active:
```
turn:openrelay.metered.ca:80
turn:openrelay.metered.ca:443
turn:openrelay.metered.ca:443?transport=tcp
```

**Pros:**
- ✅ Works immediately (no signup)
- ✅ 50GB free tier
- ✅ Good for testing and small deployments

**Cons:**
- ⚠️ Shared infrastructure (may have rate limits)
- ⚠️ Not suitable for high-traffic production

## Option 2: Twilio TURN (Production)

**Cost:** $0.40/GB
**Best for:** Production deployments

### Setup Steps:

1. **Sign up for Twilio**
   - Go to https://www.twilio.com/console
   - Navigate to "STUN/TURN" section

2. **Get Credentials**
   - Create API credentials
   - Note your username and password

3. **Add to .env.local**
   ```env
   VITE_TURN_USERNAME=your_twilio_username
   VITE_TURN_PASSWORD=your_twilio_password
   ```

4. **Restart dev server**
   ```bash
   npm run dev
   ```

The app will automatically detect and use Twilio TURN servers.

## Option 3: Self-Hosted Coturn (Advanced)

**Cost:** FREE (but requires server)
**Best for:** High-volume or privacy-sensitive deployments

### Quick Setup (Ubuntu/Debian):

```bash
# Install coturn
sudo apt-get install coturn

# Edit config
sudo nano /etc/turnserver.conf

# Add these lines:
listening-port=3478
fingerprint
lt-cred-mech
user=myusername:mypassword
realm=yourdomain.com
log-file=/var/log/turnserver.log

# Enable and start
sudo systemctl enable coturn
sudo systemctl start coturn

# Open firewall
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 49152:65535/udp
``
`

Then update `.env.local`:
```env
VITE_TURN_USERNAME=myusername
VITE_TURN_PASSWORD=mypassword
```

And modify `useWebRTC.ts` to use your server:
```typescript
{
  urls: 'turn:yourdomain.com:3478',
  username: import.meta.env.VITE_TURN_USERNAME,
  credential: import.meta.env.VITE_TURN_PASSWORD
}
```

## Testing TURN Configuration

### 1. Check Ice Candidates
Open browser console during a call and look for:
```
relay candidates (TURN working)
vs
host/srflx candidates only (STUN only)
```

### 2. Use Trickle ICE Test
Visit: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

Add your TURN server and click "Gather candidates"
- Should see `relay` type candidates

### 3. Monitor Connection Stats

Add to your code:
```typescript
pc.addEventListener('iceconnectionstatechange', () => {
  console.log('ICE connection state:', pc.iceConnectionState);
  
  pc.getStats().then(stats => {
    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        console.log('Active candidate pair:', report);
      }
    });
  });
});
```

## Current Configuration (In useWebRTC.ts)

✅ **Already Active:**
- Google STUN (public)
- Twilio STUN (public)
- Metered OpenRelay TURN (free, no credentials)

🔧 **Conditional (requires env vars):**
- Twilio TURN UDP/TCP/TLS (production-grade)

## Bandwidth Estimates

| Users | Duration | Data Usage (approx) |
|-------|----------|---------------------|
| 2     | 1 hour   | ~200 MB            |
| 5     | 1 hour   | ~500 MB            |
| 10    | 1 hour   | ~1 GB              |

**Note:** TURN is only used when direct P2P fails (~10-20% of connections)

## Recommendation

- **Development/Testing:** Use Metered OpenRelay (already configured)
- **MVP/Small Scale:** Metered with free tier or paid plan
- **Production:** Twilio TURN with proper monitoring
- **Enterprise:** Self-hosted Coturn for full control

---

**Current Status:** ✅ TURN servers configured and ready to use!
