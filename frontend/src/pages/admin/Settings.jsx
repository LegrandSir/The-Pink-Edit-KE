import React, { useState } from 'react';
import { Save, Eye, EyeOff, Plus } from 'lucide-react';

export default function Settings() {
  // --- State for interactive elements ---
  const [showMpesaKey, setShowMpesaKey] = useState(false);
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [mpesaEnabled, setMpesaEnabled] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(true);

  // Custom Toggle Switch Component
  const Toggle = ({ enabled, onChange }) => (
    <div 
      onClick={onChange} 
      className={`w-11 h-6 rounded-full cursor-pointer transition-colors flex items-center px-1 shrink-0 ${enabled ? 'bg-pink-500' : 'bg-gray-300'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-12 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-gray-900 mb-2">Store Settings</h1>
          <p className="text-sm text-gray-500 font-light">Manage your brand identity, business operations, and team access.</p>
        </div>
        <button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2.5 rounded-sm text-sm font-bold tracking-widest transition-colors flex items-center gap-2">
          <Save className="w-4 h-4" /> Save All Changes
        </button>
      </div>

      <div className="flex gap-16 items-start">
        
        {/* Inner Settings Navigation (Sticky) */}
        <aside className="w-48 sticky top-28 shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-4 px-3">Configuration</p>
          <nav className="space-y-1">
            {['General', 'Payments & Checkout', 'Shipping & Delivery', 'Taxes', 'Team & Permissions'].map((item, i) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className={`block px-3 py-2 text-sm rounded-sm transition-colors ${i === 0 ? 'text-pink-600 font-bold bg-pink-50' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {item}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Settings Content */}
        <div className="flex-1 space-y-16 pb-24">
          
          {/* GENERAL SECTION */}
          <section id="general" className="scroll-mt-28">
            <h2 className="text-xl font-serif text-gray-900 mb-1">General</h2>
            <p className="text-xs text-gray-500 mb-6">Basic information about your store and brand presence.</p>
            
            <div className="bg-white border border-gray-200 rounded-sm p-8 space-y-6 shadow-sm">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Store Name</label>
                  <input type="text" defaultValue="The Pink Edit Boutique" className="w-full px-4 py-2 bg-[#faf8f8] border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-400" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Support Email</label>
                  <input type="email" defaultValue="concierge@thepinkedit.com" className="w-full px-4 py-2 bg-[#faf8f8] border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-400" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Currency Format</label>
                  <select className="w-full px-4 py-2 bg-[#faf8f8] border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-400">
                    <option>USD ($) - US Dollar</option>
                    <option>KES (KSh) - Kenyan Shilling</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Timezone</label>
                  <select className="w-full px-4 py-2 bg-[#faf8f8] border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-400">
                    <option>EAT (East Africa Time)</option>
                    <option>UTC (Coordinated Universal Time)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* PAYMENTS SECTION */}
          <section id="payments-checkout" className="scroll-mt-28">
            <h2 className="text-xl font-serif text-gray-900 mb-1">Payments & Checkout</h2>
            <p className="text-xs text-gray-500 mb-6">Configure how you receive payments from customers worldwide.</p>
            
            <div className="bg-white border border-gray-200 rounded-sm p-8 space-y-6 shadow-sm">
              
              {/* M-Pesa Block */}
              <div className="border border-gray-200 rounded-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-sm bg-green-500 text-white font-bold flex items-center justify-center">M</div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">M-Pesa Express</h3>
                      <p className="text-xs text-gray-500">Direct mobile payments for East African customers.</p>
                    </div>
                  </div>
                  <Toggle enabled={mpesaEnabled} onChange={() => setMpesaEnabled(!mpesaEnabled)} />
                </div>
                
                {mpesaEnabled && (
                  <div className="grid grid-cols-2 gap-6 border-t border-gray-100 pt-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Shortcode</label>
                      <input type="text" defaultValue="174379" className="w-full px-4 py-2 bg-[#faf8f8] border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Passkey</label>
                      <div className="relative">
                        <input type={showMpesaKey ? "text" : "password"} defaultValue="bfb279f9aa9bdbcf158e97dd71a467cd2e0c8930" className="w-full pl-4 pr-10 py-2 bg-[#faf8f8] border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-400 font-mono text-xs" />
                        <button onClick={() => setShowMpesaKey(!showMpesaKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showMpesaKey ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stripe Block */}
              <div className="border border-gray-200 rounded-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-sm bg-blue-600 text-white font-bold flex items-center justify-center">S</div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Stripe / Card Payments</h3>
                      <p className="text-xs text-gray-500">Accept Visa, Mastercard, and Apple Pay globally.</p>
                    </div>
                  </div>
                  <Toggle enabled={stripeEnabled} onChange={() => setStripeEnabled(!stripeEnabled)} />
                </div>
                
                {stripeEnabled && (
                  <div className="border-t border-gray-100 pt-6">
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Secret API Key</label>
                    <div className="relative max-w-md">
                      <input type={showStripeKey ? "text" : "password"} defaultValue="sk_test_51MzE4uSB7YwY8Q9F..." className="w-full pl-4 pr-10 py-2 bg-[#faf8f8] border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-400 font-mono text-xs" />
                      <button onClick={() => setShowStripeKey(!showStripeKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showStripeKey ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* SHIPPING SECTION */}
          <section id="shipping-delivery" className="scroll-mt-28">
            <h2 className="text-xl font-serif text-gray-900 mb-1">Shipping & Delivery</h2>
            <p className="text-xs text-gray-500 mb-6">Set up your regional and international shipping logistics.</p>
            
            <div className="bg-white border border-gray-200 rounded-sm p-8 space-y-8 shadow-sm">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Flat Rate Shipping</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input type="text" defaultValue="15.00" className="w-full pl-8 pr-4 py-2 bg-[#faf8f8] border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-400" />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic">Applied to all orders below the threshold.</p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Free Shipping Threshold</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input type="text" defaultValue="150.00" className="w-full pl-8 pr-4 py-2 bg-[#faf8f8] border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-400" />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic">Orders above this amount qualify for free shipping.</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Active Shipping Zones</label>
                <div className="border border-gray-200 rounded-sm divide-y divide-gray-100">
                  {['North America', 'Europe', 'East Africa'].map((zone) => (
                    <div key={zone} className="flex justify-between items-center p-4">
                      <span className="text-sm font-medium text-gray-900">{zone}</span>
                      <span className="text-[10px] uppercase bg-gray-100 text-gray-600 px-2 py-1 rounded-sm tracking-widest font-bold">Standard Delivery</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* TAXES SECTION */}
          <section id="taxes" className="scroll-mt-28">
            <h2 className="text-xl font-serif text-gray-900 mb-1">Taxes</h2>
            <p className="text-xs text-gray-500 mb-6">Manage global tax rates applied to your storefront products.</p>
            
            <div className="bg-white border border-gray-200 rounded-sm p-8 shadow-sm">
               <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Global Tax Rate (%)</label>
               <div className="flex gap-4 items-center">
                 <div className="relative w-48">
                    <input type="text" defaultValue="16.0" className="w-full px-4 py-2 bg-[#faf8f8] border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-400" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                 </div>
                 <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-sm text-sm font-bold hover:bg-gray-200 transition-colors">Update Rate</button>
               </div>
               <div className="mt-6 p-4 bg-gray-50 border border-gray-100 border-l-2 border-l-gray-300 text-xs text-gray-500 rounded-r-sm">
                 Note: Tax calculations are automatically applied at checkout based on the customer's billing address.
               </div>
            </div>
          </section>

          {/* TEAM SECTION */}
          <section id="team-permissions" className="scroll-mt-28">
            <h2 className="text-xl font-serif text-gray-900 mb-1">Team & Permissions</h2>
            <p className="text-xs text-gray-500 mb-6">Collaborate with your team by managing their access levels.</p>
            
            <div className="bg-white border border-gray-200 rounded-sm p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold">Active Members</label>
                <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50">
                  <Plus className="w-3 h-3" /> Invite Staff
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Sophia Sterling', email: 'sophia@thepinkedit.com', role: 'Administrator', init: 'S' },
                  { name: 'Julian Thorne', email: 'julian@thepinkedit.com', role: 'Editor', init: 'J' },
                  { name: 'Elena Rossi', email: 'elena.r@thepinkedit.com', role: 'Viewer', init: 'E' },
                ].map((staff) => (
                  <div key={staff.email} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-lg border border-gray-200">{staff.init}</div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{staff.name}</p>
                        <p className="text-xs text-gray-500">{staff.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <select defaultValue={staff.role} className="pl-3 pr-8 py-1.5 bg-[#faf8f8] border border-gray-200 rounded-sm text-xs focus:outline-none focus:border-pink-400">
                        <option>Administrator</option>
                        <option>Editor</option>
                        <option>Viewer</option>
                        <option>Fulfillment</option>
                      </select>
                      <button className="text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-red-500 transition-colors">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}