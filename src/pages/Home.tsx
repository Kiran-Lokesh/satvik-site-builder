import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Leaf, Heart, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import satvikLogo from '@/assets/satvik-logo.png';

const Home = () => {
  const features = [
    {
      icon: <Leaf className="h-8 w-8 text-brand-green" />,
      title: "100% Natural",
      description: "Made with farm-fresh ingredients using traditional methods without any artificial preservatives."
    },
    {
      icon: <Heart className="h-8 w-8 text-brand-orange" />,
      title: "Healthy & Nutritious",
      description: "Rich in nutrients, fiber, and essential vitamins to support your healthy lifestyle."
    },
    {
      icon: <Users className="h-8 w-8 text-brand-gold" />,
      title: "Traditional Recipes",
      description: "Authentic North Karnataka recipes passed down through generations, preserving our culinary heritage."
    }
  ];

  const scrollToProducts = () => {
    // Navigate to products page
    window.location.href = '/products';
  };

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-gradient-warm opacity-10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-6">
              <img 
                src={satvikLogo} 
                alt="Satvik Foods" 
                className="h-20 lg:h-24 w-auto mx-auto object-contain"
              />
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Authentic North Karnataka Foods
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground font-medium">
                Healthy, Wholesome, Traditional
              </p>
            </div>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover the rich flavors of North Karnataka with our traditionally made, 
              farm-fresh products that bring authentic taste and nutrition to your table.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg shadow-warm"
                onClick={scrollToProducts}
              >
                View Our Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Link to="/about">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8 py-6 text-lg border-primary/20 hover:bg-primary/5"
                >
                  Learn Our Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Welcome to Satvik Foods
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We are passionate about bringing the authentic flavors and nutritional benefits 
              of traditional North Karnataka cuisine to modern kitchens. Our products are crafted 
              with love, using time-honored recipes and the finest natural ingredients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-border/50 shadow-soft hover:shadow-card transition-all duration-300">
                <CardContent className="p-8 space-y-4">
                  <div className="flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-earth text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Experience the Taste of Tradition
            </h2>
            <p className="text-lg text-primary-foreground/90 leading-relaxed">
              From wholesome millet rotis to aromatic chutney powders, each product is a 
              celebration of North Karnataka's rich culinary heritage. Join thousands of 
              families who trust Satvik Foods for their daily nutrition.
            </p>
            <Link to="/products">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-background text-foreground hover:bg-background/90 px-8 py-6 text-lg shadow-warm"
              >
                Explore Our Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;