import image from "../images/hero-bg.jpg";

export function HeroBackground(props: React.ComponentProps<"div">) {
  return (
    <div {...props}>
      <img src={image} className="h-[700px] w-auto object-cover opacity-25" />
    </div>
  );
}
