import { MarketplaceRepository } from './marketplace.repository';
import { CloudinaryService } from '../../services/cloudinary.service';
import { EmailService } from '../../services/email.service';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';
import { PaginationQuery } from '../../types';

import { IMarketplaceItem } from '../../database/models';

export class MarketplaceService {
  private marketplaceRepo: MarketplaceRepository;

  constructor() {
    this.marketplaceRepo = new MarketplaceRepository();
  }

  async createItem(
    sellerId: string,
    data: Partial<IMarketplaceItem>,
    files?: Express.Multer.File[],
  ) {
    let images: string[] = [];
    if (files && files.length > 0) {
      images = await CloudinaryService.uploadMultiple(files, 'marketplace');
    }

    return this.marketplaceRepo.createItem({
      ...data,
      sellerId: sellerId as any,
      images,
    });
  }

  async getById(id: string) {
    const item = await this.marketplaceRepo.findItemById(id);
    if (!item) throw new NotFoundError('Item not found');
    return item;
  }

  async update(itemId: string, sellerId: string, data: Partial<IMarketplaceItem>) {
    const item = await this.marketplaceRepo.findItemById(itemId);
    if (!item) throw new NotFoundError('Item not found');
    if (item.sellerId.toString() !== sellerId) {
      throw new ForbiddenError('You can only update your own items');
    }
    return this.marketplaceRepo.updateItem(itemId, data);
  }

  async uploadImages(itemId: string, sellerId: string, files: Express.Multer.File[]) {
    const item = await this.marketplaceRepo.findItemById(itemId);
    if (!item) throw new NotFoundError('Item not found');
    if (item.sellerId.toString() !== sellerId) {
      throw new ForbiddenError('You can only update your own items');
    }

    const urls = await CloudinaryService.uploadMultiple(files, 'marketplace');
    return this.marketplaceRepo.addImages(itemId, urls);
  }

  async delete(itemId: string, sellerId: string) {
    const item = await this.marketplaceRepo.findItemById(itemId);
    if (!item) throw new NotFoundError('Item not found');
    if (item.sellerId.toString() !== sellerId) {
      throw new ForbiddenError('You can only delete your own items');
    }
    await this.marketplaceRepo.softDeleteItem(itemId);
  }

  async listPublic(query: {
    page?: number;
    limit?: number;
    category?: string;
    condition?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const filter: Record<string, any> = { isSold: false };

    if (query.category) filter.category = query.category;
    if (query.condition) filter.condition = query.condition;
    if (query.location) filter.location = { $regex: query.location, $options: 'i' };
    if (query.search) filter.$text = { $search: query.search };
    if (query.minPrice || query.maxPrice) {
      filter.price = {};
      if (query.minPrice) filter.price.$gte = query.minPrice;
      if (query.maxPrice) filter.price.$lte = query.maxPrice;
    }

    return this.marketplaceRepo.findAllItems(filter, {
      page: query.page,
      limit: query.limit,
      sort: query.sort || 'createdAt',
      order: query.order || 'desc',
    });
  }

  async getUserItems(userId: string, query: PaginationQuery) {
    return this.marketplaceRepo.findItemsByUser(userId, query);
  }

  async reportItem(itemId: string, reason: string) {
    const item = await this.marketplaceRepo.findItemById(itemId);
    if (!item) throw new NotFoundError('Item not found');
    return this.marketplaceRepo.reportItem(itemId, reason);
  }

  // Chat
  async sendMessage(senderId: string, data: { receiverId: string; itemId?: string; content: string }) {
    return this.marketplaceRepo.createMessage({
      senderId: senderId as any,
      receiverId: data.receiverId as any,
      itemId: data.itemId as any,
      content: data.content,
    });
  }

  async getConversation(userId: string, otherUserId: string, itemId?: string, query?: PaginationQuery) {
    // Mark messages as read
    await this.marketplaceRepo.markMessagesAsRead(otherUserId, userId);
    return this.marketplaceRepo.getConversation(userId, otherUserId, itemId, query);
  }

  async getUserConversations(userId: string) {
    return this.marketplaceRepo.getUserConversations(userId);
  }

  // Offers
  async createOffer(buyerId: string, data: { itemId: string; offeredPrice: number; message?: string }) {
    const item = await this.marketplaceRepo.findItemById(data.itemId);
    if (!item) throw new NotFoundError('Item not found');
    if (item.sellerId.toString() === buyerId) {
      throw new BadRequestError('You cannot make an offer on your own item');
    }
    if (item.isSold) {
      throw new BadRequestError('This item is already sold');
    }

    return this.marketplaceRepo.createOffer({
      itemId: data.itemId as any,
      buyerId: buyerId as any,
      sellerId: item.sellerId,
      offeredPrice: data.offeredPrice,
      message: data.message,
    });
  }

  async updateOfferStatus(offerId: string, sellerId: string, status: 'accepted' | 'rejected') {
    const offer = await this.marketplaceRepo.findOfferById(offerId);
    if (!offer) throw new NotFoundError('Offer not found');
    if (offer.sellerId._id.toString() !== sellerId && offer.sellerId.toString() !== sellerId) {
      throw new ForbiddenError('Only the seller can update the offer status');
    }
    if (offer.status !== 'pending') {
      throw new BadRequestError(`Offer is already ${offer.status}`);
    }

    const updatedOffer = await this.marketplaceRepo.updateOfferStatus(offerId, status);

    // If accepted, send email to buyer with seller's contact details
    if (status === 'accepted' && offer.buyerId && offer.sellerId) {
      try {
        const buyer = offer.buyerId as any;
        const seller = offer.sellerId as any;
        const item = offer.itemId as any;

        if (buyer.email && seller.name && seller.email && seller.phone) {
          await EmailService.sendOfferAcceptedEmail(
            buyer.email,
            {
              itemTitle: item?.title || 'Used Item',
              offeredPrice: offer.offeredPrice,
              sellerName: seller.name,
              sellerEmail: seller.email,
              sellerPhone: seller.phone,
            }
          );
        }
      } catch (emailError) {
        console.error('Failed to send offer accepted email:', emailError);
      }
    }

    return updatedOffer;
  }

  async getUserOffersAsBuyer(buyerId: string, query: PaginationQuery) {
    return this.marketplaceRepo.findOffersByBuyer(buyerId, query);
  }

  async getUserOffersAsSeller(sellerId: string, query: PaginationQuery) {
    return this.marketplaceRepo.findOffersBySeller(sellerId, query);
  }

  async getOffersForItem(itemId: string, sellerId: string, query: PaginationQuery) {
    const item = await this.marketplaceRepo.findItemById(itemId);
    if (!item) throw new NotFoundError('Item not found');
    if (item.sellerId.toString() !== sellerId) {
      throw new ForbiddenError('You can only view offers for your own items');
    }
    return this.marketplaceRepo.findOffersForItem(itemId, query);
  }
}
