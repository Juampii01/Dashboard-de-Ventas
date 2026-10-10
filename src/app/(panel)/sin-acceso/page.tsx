import { Lock } from "lucide-react";
import { Cabecera, Contenido, Vacio } from "@/components/ui";

// Paso H5: alguien a quien se le han quitado todas las secciones de este proyecto
export default function SinAcceso() {
  return (
    <>
      <Cabecera titulo="Sin acceso" />
      <Contenido>
        <Vacio icono={Lock} texto="No tienes ninguna sección abierta en este proyecto. Pídeselo al CEO o a tu director." />
      </Contenido>
    </>
  );
}
