import Matter from 'matter-js';
import { CONFIG } from '../config.ts';
import type { ObjectDef } from '../core/types.ts';

export const BASE_THICKNESS_PX = 60;

/** RN-16: base estática de LARGURA_BASE. */
export function createBaseBody(centerX: number, topY: number): Matter.Body {
  return Matter.Bodies.rectangle(
    centerX,
    topY + BASE_THICKNESS_PX / 2,
    CONFIG.LARGURA_BASE_PX,
    BASE_THICKNESS_PX,
    {
      isStatic: true,
      label: 'base',
      friction: CONFIG.MATTER.friction,
      frictionStatic: CONFIG.MATTER.frictionStatic,
    },
  );
}

/**
 * RN-03: ao toque, o objeto vira corpo dinâmico com velocidade (0, 0) — a
 * gravidade assume a partir daqui. RN-17: hitbox sempre retangular.
 */
export function createDynamicBody(def: ObjectDef, x: number, y: number): Matter.Body {
  const body = Matter.Bodies.rectangle(x, y, def.larguraPx, def.alturaPx, {
    density: def.densidade,
    restitution: CONFIG.MATTER.restitution,
    friction: CONFIG.MATTER.friction,
    frictionStatic: CONFIG.MATTER.frictionStatic,
    slop: CONFIG.MATTER.slop,
    frictionAir: CONFIG.FISICA_AJUSTE.FRICTION_AIR,
    label: def.id,
  });
  Matter.Body.setVelocity(body, { x: 0, y: 0 });
  // Mais resistência a girar = torre mais tolerante a inclinação acumulada,
  // sem mudar atrito/restituição. Ver CONFIG.FISICA_AJUSTE.
  Matter.Body.setInertia(body, body.inertia * CONFIG.FISICA_AJUSTE.MULTIPLICADOR_INERCIA);
  return body;
}
