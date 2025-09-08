import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Leaf, Heart, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import satvikLogo from '@/assets/satvik-logo.svg';

const Home = () => {
  const features = [
    {
      icon: <Leaf className="h-8 w-8 text-brand" />,
      title: "100% Natural",
      description: "Made with farm-fresh ingredients using traditional methods without any artificial preservatives."
    },
    {
      icon: <Heart className="h-8 w-8 text-terracotta" />,
      title: "Healthy & Nutritious",
      description: "Rich in nutrients, fiber, and essential vitamins to support your healthy lifestyle."
    },
    {
      icon: <Users className="h-8 w-8 text-accent" />,
      title: "Traditional Recipes",
      description: "Authentic North Karnataka recipes passed down through generations, preserving our culinary heritage."
    }
  ];

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
                className="h-20 sm:h-24 md:h-28 lg:h-32 w-auto mx-auto object-contain"
              />
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-brandText leading-tight">
                Authentic North Karnataka Foods
              </h1>
              <p className="text-xl lg:text-2xl text-muted font-medium">
                Healthy, Wholesome, Traditional
              </p>
            </div>
            
            <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed">
              Discover the rich flavors of North Karnataka with our traditionally made, 
              farm-fresh products that bring authentic taste and nutrition to your table.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/products">
                <Button 
                  size="lg" 
                  className="bg-accent hover:bg-brand-dark text-black px-8 py-6 text-lg shadow-warm"
                >
                  View Our Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/about">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8 py-6 text-lg border-brand/20 hover:bg-brand/5 text-brand hover:text-brand-dark"
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
            <h2 className="text-3xl lg:text-4xl font-bold text-brandText">
              Welcome to Satvik Foods
            </h2>
            <p className="text-lg text-muted leading-relaxed">
              We are passionate about bringing the authentic flavors and nutritional benefits 
              of traditional North Karnataka cuisine to modern kitchens. Our products are crafted 
              with love, using time-honored recipes and the finest natural ingredients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-[rgba(0,77,61,0.08)] shadow-soft hover:shadow-card transition-all duration-300">
                <CardContent className="p-8 space-y-4">
                  <div className="flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-brandText">
                    {feature.title}
                  </h3>
                  <p className="text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-earth text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Experience the Taste of Tradition
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">
              From wholesome millet rotis to aromatic chutney powders, each product is a 
              celebration of North Karnataka's rich culinary heritage. Join thousands of 
              families who trust Satvik Foods for their daily nutrition.
            </p>
            <Link to="/products">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-surface text-brandText hover:bg-surface/90 px-8 py-6 text-lg shadow-warm"
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