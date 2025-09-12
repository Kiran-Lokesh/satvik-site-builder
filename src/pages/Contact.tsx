import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Send } from 'lucide-react';


const Contact = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  // Check for success parameter from FormSubmit redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({
        title: "Message sent successfully!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
    }
  }, [searchParams, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter your name.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Email is required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.message.trim()) {
      toast({
        title: "Message is required",
        description: "Please enter your message.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (!validateForm()) {
      e.preventDefault();
      return;
    }

    
    // Let the form submit naturally to FormSubmit
    // Don't prevent default - this allows the form to redirect to FormSubmit
    // FormSubmit will handle the submission and redirect back
  };

  const contactInfo = [
    {
      icon: <Phone className="h-6 w-6 text-brand-green" />,
      title: "Phone",
      details: "+91 98765 43210",
      description: "Mon to Fri 9am to 6pm"
    },
    {
      icon: <Mail className="h-6 w-6 text-brand-orange" />,
      title: "Email",
      details: "support@satvikfoods.ca",
      description: "We'll respond within 24 hours"
    },
    {
      icon: <MapPin className="h-6 w-6 text-brand-gold" />,
      title: "Location",
      details: "North Karnataka, India",
      description: "Where tradition meets taste"
    }
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
            Contact Us
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Have questions about our products or want to learn more about Satvik Foods? 
            We'd love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">
                Send us a Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form 
                onSubmit={handleSubmit} 
                action="https://formsubmit.co/support@satvikfoods.ca" 
                method="POST"
                className="space-y-6"
              >
                {/* FormSubmit configuration */}
                <input type="hidden" name="_subject" value="New Contact Form Submission - Satvik Foods" />
                <input type="hidden" name="_next" value="https://satvikfoods.ca/#/contact?success=true" />
                <input type="hidden" name="_captcha" value="true" />
                <input type="hidden" name="_template" value="table" />
                <input type="hidden" name="_autoresponse" value="Thank you for contacting Satvik Foods! We'll get back to you within 24 hours." />
                
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    required
                    className="border-border/50 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    required
                    className="border-border/50 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us about your inquiry..."
                    rows={5}
                    required
                    className="border-border/50 focus:border-primary resize-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-warm"
                >
                  Send Message
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
              
              {/* FormSubmit Notice */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> After clicking "Send Message", you may be asked to complete a quick verification to prevent spam. This is normal and helps protect our contact system.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">
                Get in Touch
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Whether you have questions about our products, need help with an order, 
                or want to learn more about our story, we're here to help.
              </p>
            </div>

            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <Card key={index} className="border-border/50 shadow-soft hover:shadow-card transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {info.icon}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-card-foreground">
                          {info.title}
                        </h3>
                        <p className="text-lg font-medium text-primary">
                          {info.details}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Info */}
            <Card className="bg-gradient-hero border-border/50">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-card-foreground">
                  Business Hours
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>9:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Contact;