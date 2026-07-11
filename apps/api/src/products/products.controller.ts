import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

/** Endpoint publik untuk storefront */
@Controller("products")
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  list(
    @Query("category") category?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.products.findPublic({
      category,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get(":slug")
  detail(@Param("slug") slug: string) {
    return this.products.findBySlug(slug);
  }
}

/** Endpoint admin (Refine) — format response { data, total } */
@Controller("admin/products")
@UseGuards(JwtAuthGuard)
export class AdminProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  async list(
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    const [data, total] = await this.products.findAllAdmin({
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return { data, total };
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.products.findOneAdmin(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.products.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.products.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.products.remove(id);
  }

  @Post(":id/variants")
  createVariant(@Param("id") id: string, @Body() body: any) {
    return this.products.createVariant(id, body);
  }

  @Patch("variants/:variantId")
  updateVariant(@Param("variantId") variantId: string, @Body() body: any) {
    return this.products.updateVariant(variantId, body);
  }

  @Delete("variants/:variantId")
  removeVariant(@Param("variantId") variantId: string) {
    return this.products.removeVariant(variantId);
  }

  @Post(":id/images")
  addImage(@Param("id") id: string, @Body() body: any) {
    return this.products.addImage(id, body);
  }

  @Delete("images/:imageId")
  removeImage(@Param("imageId") imageId: string) {
    return this.products.removeImage(imageId);
  }
}
