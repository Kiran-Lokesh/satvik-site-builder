import { Card, CardContent } from '@/components/ui/card';
import { Wheat, Heart, Users, Award } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: <Heart className="h-8 w-8 text-brand-orange" />,
      title: "Family First",
      description: "Every recipe we share is one we'd happily serve to our own children."
    },
    {
      icon: <Wheat className="h-8 w-8 text-brand-green" />,
      title: "Farm to Table",
      description: "We partner directly with farmers and suppliers in India for fresh, authentic ingredients."
    },
    {
      icon: <Users className="h-8 w-8 text-brand-gold" />,
      title: "Health Always",
      description: "No shortcuts, no artificial preservatives – only natural, nourishing foods."
    },
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      title: "Community & Tradition",
      description: "Supporting rural communities and preserving South Indian culinary heritage for the next generation."
    }
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
            About Satvik Foods
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Celebrating Family, Tradition, and Authentic South Indian Flavors
          </p>
        </div>

        {/* Story Section */}
        <section className="max-w-4xl mx-auto space-y-8">
          <div className="bg-gradient-hero rounded-2xl p-8 lg:p-12 space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary text-center">
              Our Story
            </h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p className="text-lg">
                Satvik Foods was started by two close-knit migrant families in Canada – Kiran & Shruthi with their daughter Smrithi, and Yeshwanth & Anusha with their daughter. Together, we share a common passion: bringing the authentic taste of South Indian cuisine to homes in Canada, where food choices are often dominated by other regional flavors.
              </p>
              <p>
                We source directly from trusted suppliers and farmers in India, ensuring freshness, authenticity, and a true farm-to-table experience. Every product reflects the recipes and traditions we grew up with, prepared with love and care – the same way we cook for our own families.
              </p>
              <p>
                For us, Satvik Foods is more than a business. It's about keeping our cultural heritage alive, nourishing our families with healthy, natural foods, and sharing those same traditions with yours.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="text-center space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Our Mission
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            To bring authentic, wholesome South Indian foods to Canadian homes while preserving culinary heritage and supporting farming communities in India.
          </p>
        </section>

        {/* Values Grid */}
        <section className="space-y-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-border/50 shadow-soft hover:shadow-card transition-all duration-300">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center space-x-4">
                    {value.icon}
                    <h3 className="text-xl font-semibold text-card-foreground">
                      {value.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quality Promise */}
        <section className="bg-gradient-earth text-primary-foreground rounded-2xl p-8 lg:p-12 text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Our Quality Promise
          </h2>
          <p className="text-lg text-primary-foreground/90 max-w-3xl mx-auto leading-relaxed">
            Every product that bears the Satvik Foods name is a testament to our commitment to 
            quality, authenticity, and your family's health. We use only the finest natural 
            ingredients, traditional preparation methods, and maintain the highest standards 
            of hygiene and packaging.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
            <span className="bg-primary-foreground/20 px-4 py-2 rounded-full">100% Natural</span>
            <span className="bg-primary-foreground/20 px-4 py-2 rounded-full">No Preservatives</span>
            <span className="bg-primary-foreground/20 px-4 py-2 rounded-full">Traditional Methods</span>
            <span className="bg-primary-foreground/20 px-4 py-2 rounded-full">Farm Fresh</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;